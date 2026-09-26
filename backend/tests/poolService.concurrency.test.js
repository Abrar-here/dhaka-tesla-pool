const { connectTestDB, clearTestDB, disconnectTestDB } = require("./setup");
const mongoose = require("mongoose");
const User = require("../src/models/User");
const Tesla = require("../src/models/Tesla");
const Ride = require("../src/models/Ride");
const RideMember = require("../src/models/RideMember");
const poolService = require("../src/services/poolService");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// Helper to create a bare-bones passenger user for these tests.
async function createPassenger(email) {
  return User.create({
    name: email,
    email,
    passwordHash: "irrelevant-for-this-test",
    role: "passenger",
  });
}

describe("poolService concurrency: the last-seat race", () => {
  test("only one of two simultaneous requests can claim the last seat", async () => {
    // Manually create a ride with exactly 1 free seat: 2 taken out of 3.
    const ride = await Ride.create({
      pickupZone: "BANANI",
      status: "REQUESTED",
      seatsTotal: 3,
      seatsTaken: 2,
    });

    const nusrat = await createPassenger("race-nusrat@test.com");
    const shirin = await createPassenger("race-shirin@test.com");

    // Fire both requests at essentially the same time, racing for the
    // one remaining seat.
    const results = await Promise.allSettled([
      poolService.requestRide({
        passengerId: nusrat._id,
        pickupZone: "BANANI",
        dropoffZone: "MOHAKHALI",
      }),
      poolService.requestRide({
        passengerId: shirin._id,
        pickupZone: "BANANI",
        dropoffZone: "GULSHAN",
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one should succeed, exactly one should fail with a conflict.
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0].reason.message).toMatch(/no seats available/i);

    // The ride's seatsTaken must be exactly 3 (never over capacity, and
    // never double-counted).
    const finalRide = await Ride.findById(ride._id);
    expect(finalRide.seatsTaken).toBe(3);

    // Only one RideMember should have been created out of this race.
    const members = await RideMember.find({ ride: ride._id });
    expect(members.length).toBe(1);
  });

  test("seatsTaken never goes negative and never exceeds seatsTotal even under repeated contention", async () => {
    const ride = await Ride.create({
      pickupZone: "MIRPUR",
      status: "REQUESTED",
      seatsTotal: 2,
      seatsTaken: 0,
    });

    const passengers = await Promise.all(
      [
        "p1@test.com",
        "p2@test.com",
        "p3@test.com",
        "p4@test.com",
        "p5@test.com",
      ].map(createPassenger),
    );

    // 5 passengers race for only 2 seats.
    const results = await Promise.allSettled(
      passengers.map((p) =>
        poolService.requestRide({
          passengerId: p._id,
          pickupZone: "MIRPUR",
          dropoffZone: "UTTARA",
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled.length).toBe(2); // only 2 seats existed

    const finalRide = await Ride.findById(ride._id);
    expect(finalRide.seatsTaken).toBe(2);
    expect(finalRide.seatsTaken).toBeLessThanOrEqual(finalRide.seatsTotal);
    expect(finalRide.seatsTaken).toBeGreaterThanOrEqual(0);
  });
});
