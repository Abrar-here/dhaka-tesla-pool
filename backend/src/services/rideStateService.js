const Ride = require("../models/Ride");
const RideMember = require("../models/RideMember");
const RideStatusHistory = require("../models/RideStatusHistory");
const {
  RIDE_STATUS,
  MEMBER_STATUS,
  RIDE_TRANSITIONS,
} = require("../utils/constants");
const {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} = require("../utils/errors");

function assertTransitionAllowed(fromStatus, toStatus) {
  const allowed = RIDE_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new ConflictError(
      `Invalid state transition: cannot go from ${fromStatus} to ${toStatus}`,
    );
  }
}

/**
 * Advance a ride to the next lifecycle stage. Only the assigned driver
 * may advance DRIVER_ARRIVED / STARTED / COMPLETED - enforced here, not
 * just in the route layer, so the rule holds regardless of entry point.
 */
async function advanceRideStatus({ rideId, driverId, toStatus }) {
  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");
  if (String(ride.driver) !== String(driverId)) {
    throw new ForbiddenError(
      "Only the assigned driver can update this ride's status",
    );
  }
  assertTransitionAllowed(ride.status, toStatus);

  const fromStatus = ride.status;
  ride.status = toStatus;
  await ride.save();

  await RideMember.updateMany(
    { ride: ride._id, status: { $ne: MEMBER_STATUS.CANCELLED } },
    { $set: { status: toStatus } },
  );

  await RideStatusHistory.create({
    ride: ride._id,
    fromStatus,
    toStatus,
    actor: driverId,
  });

  return ride;
}

/**
 * A passenger cancels their own membership only (not the whole pool),
 * releasing their seat back to the ride atomically. Other passengers in
 * the same pool are unaffected - satisfies "each passenger... their own
 * status, not anyone else's."
 */
async function cancelMembership({ rideMemberId, passengerId, reason }) {
  const member = await RideMember.findById(rideMemberId);
  if (!member) throw new NotFoundError("Ride membership not found");
  if (String(member.passenger) !== String(passengerId)) {
    throw new ForbiddenError("You can only cancel your own ride request");
  }
  if (
    [MEMBER_STATUS.COMPLETED, MEMBER_STATUS.CANCELLED].includes(member.status)
  ) {
    throw new ConflictError(`Cannot cancel a ride already ${member.status}`);
  }
  if (member.status === MEMBER_STATUS.STARTED) {
    throw new ConflictError("Cannot cancel a ride that has already started");
  }

  const fromStatus = member.status;
  member.status = MEMBER_STATUS.CANCELLED;
  await member.save();

  // Release the seat atomically; never let seatsTaken go negative.
  await Ride.updateOne(
    { _id: member.ride, seatsTaken: { $gt: 0 } },
    { $inc: { seatsTaken: -1 } },
  );

  // If this was the last active member, cancel the ride shell too.
  const activeCount = await RideMember.countDocuments({
    ride: member.ride,
    status: { $ne: MEMBER_STATUS.CANCELLED },
  });
  if (activeCount === 0) {
    await Ride.updateOne(
      { _id: member.ride },
      { $set: { status: RIDE_STATUS.CANCELLED } },
    );
  }

  await RideStatusHistory.create({
    ride: member.ride,
    rideMember: member._id,
    fromStatus,
    toStatus: MEMBER_STATUS.CANCELLED,
    actor: passengerId,
    reason: reason || null,
  });

  return member;
}

module.exports = {
  advanceRideStatus,
  cancelMembership,
  assertTransitionAllowed,
};
