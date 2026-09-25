const Tesla = require("../models/Tesla");
const {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} = require("../utils/errors");

async function createTesla(req, res) {
  const { nickname, plateNumber, capacity } = req.body;
  if (!nickname || !plateNumber || !capacity) {
    throw new ValidationError(
      "nickname, plateNumber, and capacity are required",
    );
  }
  const tesla = await Tesla.create({
    driver: req.user._id,
    nickname,
    plateNumber,
    capacity,
  });
  res.status(201).json({ tesla });
}

async function myTeslas(req, res) {
  const teslas = await Tesla.find({ driver: req.user._id });
  res.status(200).json({ teslas });
}

async function setActive(req, res) {
  const tesla = await Tesla.findById(req.params.id);
  if (!tesla) throw new NotFoundError("Tesla not found");
  if (String(tesla.driver) !== String(req.user._id)) {
    throw new ForbiddenError("You do not own this Tesla");
  }
  tesla.isActive = Boolean(req.body.isActive);
  await tesla.save();
  res.status(200).json({ tesla });
}

module.exports = { createTesla, myTeslas, setActive };
