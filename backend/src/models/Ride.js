const mongoose = require("mongoose");
const { RIDE_STATUS, ZONE_NAMES } = require("../utils/constants");

// A Ride represents one Tesla's trip instance, which can carry 1..N
// passengers (a "pool"). Individual passenger requests are RideMember
// documents that reference this Ride. See docs/SCHEMA.md for rationale.
const rideSchema = new mongoose.Schema(
  {
    tesla: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tesla",
      default: null,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(RIDE_STATUS),
      default: RIDE_STATUS.REQUESTED,
      index: true,
    },
    // Snapshot of the Tesla's capacity at match time, so later capacity
    // changes on the vehicle don't retroactively corrupt an in-progress ride.
    seatsTotal: { type: Number, default: 0 },
    // Incremented atomically via findOneAndUpdate + $inc — see
    // services/poolService.js and docs/SCHEMA.md "Concurrency" section.
    seatsTaken: { type: Number, default: 0 },
    pickupZone: { type: String, enum: ZONE_NAMES, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ride", rideSchema);
