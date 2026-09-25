const mongoose = require("mongoose");

// Append-only audit log. Never updated or deleted — satisfies the PRD's
// requirement to "hold onto enough history to explain exactly what
// happened" after a ride completes.
const rideStatusHistorySchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    rideMember: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RideMember",
      default: null,
    },
    fromStatus: { type: String, default: null },
    toStatus: { type: String, required: true },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

module.exports = mongoose.model("RideStatusHistory", rideStatusHistorySchema);
