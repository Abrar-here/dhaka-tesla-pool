const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token)
    return next(new UnauthorizedError("Missing authentication token"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return next(new UnauthorizedError("User no longer exists"));
    req.user = user;
    next();
  } catch (err) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`This action requires role: ${roles.join(" or ")}`),
      );
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
