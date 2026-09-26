require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/db");
const User = require("../models/User");
const Tesla = require("../models/Tesla");
const Ride = require("../models/Ride");
const RideMember = require("../models/RideMember");
const RideStatusHistory = require("../models/RideStatusHistory");
const poolService = require("../services/poolService");

// Seed data uses the PRD's story cast throughout (Jashim/Bullet,
// Nusrat/Rafiq/Shirin) rather than generic user1/driver1 placeholders.
async function seed() {
  await connectDB(process.env.MONGO_URI);

  console.log("[seed] clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Tesla.deleteMany({}),
    Ride.deleteMany({}),
    RideMember.deleteMany({}),
    RideStatusHistory.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const jashim = await User.create({
    name: "Jashim Uddin",
    email: "jashim@dhakatesla.com",
    passwordHash,
    role: "driver",
    phone: "01710000001",
  });

  const nusrat = await User.create({
    name: "Nusrat Jahan",
    email: "nusrat@dhakatesla.com",
    passwordHash,
    role: "passenger",
    phone: "01810000002",
  });

  const rafiq = await User.create({
    name: "Rafiq Islam",
    email: "rafiq@dhakatesla.com",
    passwordHash,
    role: "passenger",
    phone: "01910000003",
  });

  const shirin = await User.create({
    name: "Shirin Akter",
    email: "shirin@dhakatesla.com",
    passwordHash,
    role: "passenger",
    phone: "01610000004",
  });

  const bullet = await Tesla.create({
    driver: jashim._id,
    nickname: "Bullet",
    plateNumber: "DHK-TESLA-01",
    capacity: 3,
  });

  console.log("[seed] created users:", {
    jashim: jashim.email,
    nusrat: nusrat.email,
    rafiq: rafiq.email,
    shirin: shirin.email,
  });
  console.log("[seed] created Tesla:", bullet.nickname, bullet.plateNumber);

  // Recreate the opening scenario: Nusrat requests Banani -> Mohakhali,
  // Rafiq requests the same pickup zone and pools onto the same ride,
  // then Jashim matches Bullet to the pool.
  const { ride: ride1 } = await poolService.requestRide({
    passengerId: nusrat._id,
    pickupZone: "BANANI",
    dropoffZone: "MOHAKHALI",
  });
  console.log("[seed] Nusrat requested a ride:", ride1._id.toString());

  const { ride: ride2 } = await poolService.requestRide({
    passengerId: rafiq._id,
    pickupZone: "BANANI",
    dropoffZone: "GULSHAN",
  });
  console.log(
    "[seed] Rafiq pooled onto ride:",
    ride2._id.toString(),
    "(same ride as Nusrat:",
    String(ride1._id) === String(ride2._id),
    ")",
  );

  await poolService.matchRide({
    rideId: ride1._id,
    driverId: jashim._id,
    teslaId: bullet._id,
  });
  console.log("[seed] Jashim matched Bullet to the pooled ride");

  console.log(
    "\n[seed] Done. Demo credentials (all use password: password123):",
  );
  console.log("  Driver:    jashim@dhakatesla.com");
  console.log("  Passenger: nusrat@dhakatesla.com");
  console.log("  Passenger: rafiq@dhakatesla.com");
  console.log(
    "  Passenger: shirin@dhakatesla.com (free to demo new requests / last-seat race)",
  );

  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
