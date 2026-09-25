const express = require("express");
const rideController = require("../controllers/rideController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ZONE_NAMES } = require("../utils/constants");

const router = express.Router();

router.use(requireAuth);

router.get("/zones", (req, res) => res.status(200).json({ zones: ZONE_NAMES }));

// Passenger actions
router.post("/", requireRole("passenger"), rideController.requestRide);
router.get("/mine", requireRole("passenger"), rideController.myRides);
router.post(
  "/members/:memberId/cancel",
  requireRole("passenger"),
  rideController.cancelMembership,
);

// Driver actions
router.get("/available", requireRole("driver"), rideController.availableRides);
router.get("/driver/mine", requireRole("driver"), rideController.driverRides);
router.post("/:id/match", requireRole("driver"), rideController.matchRide);
router.post(
  "/:id/advance",
  requireRole("driver"),
  rideController.advanceStatus,
);

// Shared: audit history (access-controlled inside the controller)
router.get("/:id/history", rideController.rideHistory);

module.exports = router;
