const mongoose = require("mongoose");
const {
  MEMBER_STATUS,
  ZONE_NAMES,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} = require("../utils/constants");

const fareBreakdownSchema = new mongoose.Schema(
  {
    baseFarePoysha: { type: Number, required: true },
    distanceChargePoysha: { type: Number, required: true },
    poolDiscountPoysha: { type: Number, required: true, default: 0 },
    totalFarePoysha: { type: Number, required: true },
  },
  { _id: false },
);

// One RideMember = one passenger's individual request within a Ride/pool.
// This is what lets each passenger see only their own fare and status,
// per the PRD's explicit privacy requirement.
const rideMemberSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pickupZone: { type: String, enum: ZONE_NAMES, required: true },
    dropoffZone: { type: String, enum: ZONE_NAMES, required: true },
    distanceKm: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(MEMBER_STATUS),
      default: MEMBER_STATUS.REQUESTED,
    },
    fareBreakdown: { type: fareBreakdownSchema, required: true },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      default: PAYMENT_METHOD.CASH,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
  },
  { timestamps: true },
);

// A passenger can only join a given ride once.
rideMemberSchema.index({ ride: 1, passenger: 1 }, { unique: true });

module.exports = mongoose.model("RideMember", rideMemberSchema);
