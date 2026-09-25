const Ride = require("../models/Ride");
const RideMember = require("../models/RideMember");
const RideStatusHistory = require("../models/RideStatusHistory");
const Tesla = require("../models/Tesla");
const { distanceBetweenZones, calculateFare } = require("./fareService");
const { RIDE_STATUS, MEMBER_STATUS } = require("../utils/constants");
const { ConflictError, NotFoundError } = require("../utils/errors");

/**
 * Matching rule (documented per PRD Section 4):
 * Two ride requests are "poolable" if they share the same pickupZone.
 * This is intentionally simple - real systems would consider route
 * overlap/detour cost, but "same pickup zone, any Tesla with a free seat"
 * is a rule we can explain and apply consistently.
 *
 * Given a pickup zone, find an existing REQUESTED/MATCHED ride at that
 * zone with a free seat to join, or return null (caller creates a new one).
 */
async function findPoolableRide(pickupZone) {
  return Ride.findOne({
    pickupZone,
    status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.MATCHED] },
    $expr: { $lt: ["$seatsTaken", "$seatsTotal"] },
  }).sort({ createdAt: 1 });
}

/**
 * Request a ride: find a poolable ride or create a new one, then
 * atomically claim a seat and attach a RideMember for this passenger.
 *
 * The seat claim uses findOneAndUpdate with a condition on seatsTaken
 * seatsTotal executed atomically by MongoDB, so two concurrent requests
 * racing for the last seat cannot both succeed - the loser's filter
 * fails to match and gets a clean ConflictError. See docs/SCHEMA.md.
 */
async function requestRide({
  passengerId,
  pickupZone,
  dropoffZone,
  preferredTeslaId,
}) {
  let ride = await findPoolableRide(pickupZone);

  if (!ride) {
    // No poolable ride exists yet - create a fresh REQUESTED ride.
    // It only gets a Tesla/driver assigned once matched (see matchRide).
    let seatsTotal = 4; // default assumption until a Tesla is matched
    if (preferredTeslaId) {
      const tesla = await Tesla.findById(preferredTeslaId);
      if (!tesla) throw new NotFoundError("Requested Tesla not found");
      seatsTotal = tesla.capacity;
    }
    ride = await Ride.create({
      pickupZone,
      status: RIDE_STATUS.REQUESTED,
      seatsTotal,
      seatsTaken: 0,
    });
  }

  // Atomic claim: only succeeds if a seat is still free at write time.
  const claimed = await Ride.findOneAndUpdate(
    { _id: ride._id, $expr: { $lt: ["$seatsTaken", "$seatsTotal"] } },
    { $inc: { seatsTaken: 1 } },
    { new: true },
  );
  if (!claimed) {
    throw new ConflictError(
      "No seats available on this ride - please try again",
    );
  }

  const distanceKm = distanceBetweenZones(pickupZone, dropoffZone);
  const isPooled = claimed.seatsTaken > 1;
  const fareBreakdown = calculateFare({ distanceKm, isPooled });

  let member;
  try {
    member = await RideMember.create({
      ride: claimed._id,
      passenger: passengerId,
      pickupZone,
      dropoffZone,
      distanceKm,
      status: claimed.status,
      fareBreakdown,
    });
  } catch (err) {
    // Roll back the seat claim if member creation fails (e.g. duplicate
    // join) so seatsTaken never drifts from the real membership count.
    await Ride.updateOne({ _id: claimed._id }, { $inc: { seatsTaken: -1 } });
    if (err.code === 11000) {
      throw new ConflictError("You have already requested this ride");
    }
    throw err;
  }

  await RideStatusHistory.create({
    ride: claimed._id,
    rideMember: member._id,
    fromStatus: null,
    toStatus: MEMBER_STATUS.REQUESTED,
    actor: passengerId,
  });

  // If pooling raised seatsTaken above 1, retroactively re-price the
  // earlier member(s) on this ride too, since their pool discount now
  // applies. Kept simple and explicit rather than hidden magic.
  if (isPooled) {
    const otherMembers = await RideMember.find({
      ride: claimed._id,
      _id: { $ne: member._id },
      status: { $ne: MEMBER_STATUS.CANCELLED },
    });
    for (const other of otherMembers) {
      const recalculated = calculateFare({
        distanceKm: other.distanceKm,
        isPooled: true,
      });
      other.fareBreakdown = recalculated;
      await other.save();
    }
  }

  return { ride: claimed, member };
}

/**
 * Driver accepts / matches a ride to their Tesla. Moves ride and all its
 * current members from REQUESTED -> MATCHED.
 */
async function matchRide({ rideId, driverId, teslaId }) {
  const tesla = await Tesla.findOne({ _id: teslaId, driver: driverId });
  if (!tesla) throw new NotFoundError("Tesla not found for this driver");

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");
  if (ride.status !== RIDE_STATUS.REQUESTED) {
    throw new ConflictError(`Cannot match a ride in status ${ride.status}`);
  }
  if (ride.seatsTaken > tesla.capacity) {
    throw new ConflictError(
      "This Tesla does not have enough seats for the current pool",
    );
  }

  ride.driver = driverId;
  ride.tesla = tesla._id;
  ride.seatsTotal = tesla.capacity;
  ride.status = RIDE_STATUS.MATCHED;
  await ride.save();

  await RideMember.updateMany(
    { ride: ride._id, status: MEMBER_STATUS.REQUESTED },
    { $set: { status: MEMBER_STATUS.MATCHED } },
  );

  await RideStatusHistory.create({
    ride: ride._id,
    fromStatus: RIDE_STATUS.REQUESTED,
    toStatus: RIDE_STATUS.MATCHED,
    actor: driverId,
  });

  return ride;
}

module.exports = { findPoolableRide, requestRide, matchRide };
