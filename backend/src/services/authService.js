const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ValidationError, UnauthorizedError } = require("../utils/errors");

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

async function register({ name, email, password, role, phone }) {
  if (!name || !email || !password || !role) {
    throw new ValidationError("name, email, password, and role are required");
  }
  if (!["passenger", "driver"].includes(role)) {
    throw new ValidationError("role must be 'passenger' or 'driver'");
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ValidationError("Email already in use");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role, phone });
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) throw new UnauthorizedError("Invalid email or password");
  const match = await bcrypt.compare(password || "", user.passwordHash);
  if (!match) throw new UnauthorizedError("Invalid email or password");
  return { user, token: signToken(user) };
}

module.exports = { register, login, signToken };
