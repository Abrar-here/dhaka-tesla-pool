const express = require("express");
const teslaController = require("../controllers/teslaController");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("driver"));
router.post("/", teslaController.createTesla);
router.get("/mine", teslaController.myTeslas);
router.patch("/:id/active", teslaController.setActive);

module.exports = router;
