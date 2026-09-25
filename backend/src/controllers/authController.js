const authService = require("../services/authService");

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    walletBalancePoysha: user.walletBalancePoysha,
  };
}

async function register(req, res) {
  const { user, token } = await authService.register(req.body);
  res.status(201).json({ user: sanitizeUser(user), token });
}

async function login(req, res) {
  const { user, token } = await authService.login(req.body);
  res.status(200).json({ user: sanitizeUser(user), token });
}

async function me(req, res) {
  res.status(200).json({ user: sanitizeUser(req.user) });
}

module.exports = { register, login, me, sanitizeUser };
