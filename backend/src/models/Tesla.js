const mongoose = require("mongoose");

const teslaSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nickname: { type: String, required: true, trim: true }, // e.g. "Bullet"
    plateNumber: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1, max: 6 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Tesla", teslaSchema);
