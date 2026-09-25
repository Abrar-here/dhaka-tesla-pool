const Ride = require("../models/Ride");
const RideMember = require("../models/RideMember");
const RideStatusHistory = require("../models/RideStatusHistory");
const poolService = require("../services/poolService");
const rideStateService = require("../services/rideStateService");
const {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} = require("../utils/errors");
const { ZONE_NAMES, RIDE_STATUS } = require("../utils/constants");

async function requestRide(req, res) {
  const { pickupZone, dropoffZone, preferredTeslaId } = req.body;
  if (!pickupZone || !dropoffZone) {
    throw new ValidationError("pickupZone and dropoffZone are required");
  }
  if (!ZONE_NAMES.includes(pickupZone) || !ZONE_NAMES.includes(dropoffZone)) {
    throw new ValidationError(`Zones must be one of: ${ZONE_NAMES.join(", ")}`);
  }
  const { ride, member } = await poolService.requestRide({
    passengerId: req.user._id,
    pickupZone,
    dropoffZone,
    preferredTeslaId,
  });
  res.status(201).json({ ride, member });
}

// Passenger's own ride memberships (their private fare/status view).
async function myRides(req, res) {
  const members = await RideMember.find({ passenger: req.user._id })
    .populate({ path: "ride", populate: { path: "driver tesla" } })
    .sort({ createdAt: -1 });
  res.status(200).json({ rides: members });
}

// Driver's view: rides matched to them, including all pool members
// (driver needs to see who's assigned to the ride).
async function driverRides(req, res) {
  const rides = await Ride.find({ driver: req.user._id }).sort({
    createdAt: -1,
  });
  const rideIds = rides.map((r) => r._id);
  const members = await RideMember.find({ ride: { $in: rideIds } }).populate(
    "passenger",
  );
  const membersByRide = {};
  for (const m of members) {
    const key = String(m.ride);
    (membersByRide[key] = membersByRide[key] || []).push(m);
  }
  const result = rides.map((r) => ({
    ride: r,
    members: membersByRide[String(r._id)] || [],
  }));
  res.status(200).json({ rides: result });
}

// Open ride requests a driver could match (REQUESTED, with a free seat).
async function availableRides(req, res) {
  const rides = await Ride.find({
    status: RIDE_STATUS.REQUESTED,
    $expr: { $lt: ["$seatsTaken", { $ifNull: ["$seatsTotal", 4] }] },
  }).sort({ createdAt: 1 });
  res.status(200).json({ rides });
}

async function matchRide(req, res) {
  const { teslaId } = req.body;
  if (!teslaId) throw new ValidationError("teslaId is required");
  const ride = await poolService.matchRide({
    rideId: req.params.id,
    driverId: req.user._id,
    teslaId,
  });
  res.status(200).json({ ride });
}

async function advanceStatus(req, res) {
  const { toStatus } = req.body;
  if (!toStatus) throw new ValidationError("toStatus is required");
  const ride = await rideStateService.advanceRideStatus({
    rideId: req.params.id,
    driverId: req.user._id,
    toStatus,
  });
  res.status(200).json({ ride });
}

async function cancelMembership(req, res) {
  const member = await rideStateService.cancelMembership({
    rideMemberId: req.params.memberId,
    passengerId: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json({ member });
}

// Full audit history for a ride - only the driver or a member passenger
// of that ride may view it.
async function rideHistory(req, res) {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw new NotFoundError("Ride not found");

  const isDriver = ride.driver && String(ride.driver) === String(req.user._id);
  const isMember = await RideMember.exists({
    ride: ride._id,
    passenger: req.user._id,
  });
  if (!isDriver && !isMember) {
    throw new ForbiddenError("You do not have access to this ride's history");
  }

  const history = await RideStatusHistory.find({ ride: ride._id }).sort({
    createdAt: 1,
  });
  res.status(200).json({ history });
}

module.exports = {
  requestRide,
  myRides,
  driverRides,
  availableRides,
  matchRide,
  advanceStatus,
  cancelMembership,
  rideHistory,
};
