const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["passenger", "driver"],
      required: true,
    },
    phone: { type: String, trim: true },
    // Money stored as an integer in poysha (1 Taka = 100 poysha) to avoid
    // floating point rounding errors in wallet math. See docs/SCHEMA.md.
    walletBalancePoysha: { type: Number, default: 100000 }, // seed with 1000 Taka
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
