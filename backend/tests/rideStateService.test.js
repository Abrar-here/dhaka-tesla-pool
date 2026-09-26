const { connectTestDB, clearTestDB, disconnectTestDB } = require("./setup");
const User = require("../src/models/User");
const Ride = require("../src/models/Ride");
const RideMember = require("../src/models/RideMember");
const RideStatusHistory = require("../src/models/RideStatusHistory");
const rideStateService = require("../src/services/rideStateService");
const { calculateFare } = require("../src/services/fareService");

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

async function createUser(role, email) {
  return User.create({
    name: email,
    email,
    passwordHash: "irrelevant-for-this-test",
    role,
  });
}

async function createMatchedRide(driverId) {
  return Ride.create({
    pickupZone: "BANANI",
    status: "MATCHED",
    driver: driverId,
    seatsTotal: 3,
    seatsTaken: 1,
  });
}

describe("rideStateService.advanceRideStatus", () => {
  test("allows the assigned driver to move MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED", async () => {
    const driver = await createUser("driver", "driver1@test.com");
    const ride = await createMatchedRide(driver._id);

    const step1 = await rideStateService.advanceRideStatus({
      rideId: ride._id,
      driverId: driver._id,
      toStatus: "DRIVER_ARRIVED",
    });
    expect(step1.status).toBe("DRIVER_ARRIVED");

    const step2 = await rideStateService.advanceRideStatus({
      rideId: ride._id,
      driverId: driver._id,
      toStatus: "STARTED",
    });
    expect(step2.status).toBe("STARTED");

    const step3 = await rideStateService.advanceRideStatus({
      rideId: ride._id,
      driverId: driver._id,
      toStatus: "COMPLETED",
    });
    expect(step3.status).toBe("COMPLETED");

    // The audit trail should have one entry per transition.
    const history = await RideStatusHistory.find({ ride: ride._id }).sort({
      createdAt: 1,
    });
    expect(history.length).toBe(3);
    expect(history.map((h) => h.toStatus)).toEqual([
      "DRIVER_ARRIVED",
      "STARTED",
      "COMPLETED",
    ]);
  });

  test("rejects skipping a stage (MATCHED -> STARTED directly)", async () => {
    const driver = await createUser("driver", "driver2@test.com");
    const ride = await createMatchedRide(driver._id);

    await expect(
      rideStateService.advanceRideStatus({
        rideId: ride._id,
        driverId: driver._id,
        toStatus: "STARTED",
      }),
    ).rejects.toThrow(/invalid state transition/i);
  });

  test("rejects advancing a ride that is not yours", async () => {
    const driver = await createUser("driver", "driver3@test.com");
    const impostor = await createUser("driver", "impostor@test.com");
    const ride = await createMatchedRide(driver._id);

    await expect(
      rideStateService.advanceRideStatus({
        rideId: ride._id,
        driverId: impostor._id,
        toStatus: "DRIVER_ARRIVED",
      }),
    ).rejects.toThrow(/only the assigned driver/i);
  });

  test("rejects advancing a completed ride any further", async () => {
    const driver = await createUser("driver", "driver4@test.com");
    const ride = await createMatchedRide(driver._id);
    ride.status = "COMPLETED";
    await ride.save();

    await expect(
      rideStateService.advanceRideStatus({
        rideId: ride._id,
        driverId: driver._id,
        toStatus: "STARTED",
      }),
    ).rejects.toThrow(/invalid state transition/i);
  });
});

describe("rideStateService.cancelMembership", () => {
  async function createRideWithMember(passengerId, status = "REQUESTED") {
    const ride = await Ride.create({
      pickupZone: "GULSHAN",
      status,
      seatsTotal: 3,
      seatsTaken: 1,
    });
    const fareBreakdown = calculateFare({ distanceKm: 2, isPooled: false });
    const member = await RideMember.create({
      ride: ride._id,
      passenger: passengerId,
      pickupZone: "GULSHAN",
      dropoffZone: "BANANI",
      distanceKm: 2,
      status,
      fareBreakdown,
    });
    return { ride, member };
  }

  test("a passenger can cancel their own request, releasing the seat", async () => {
    const passenger = await createUser("passenger", "cancel1@test.com");
    const { ride, member } = await createRideWithMember(passenger._id);

    const cancelled = await rideStateService.cancelMembership({
      rideMemberId: member._id,
      passengerId: passenger._id,
    });
    expect(cancelled.status).toBe("CANCELLED");

    const updatedRide = await Ride.findById(ride._id);
    expect(updatedRide.seatsTaken).toBe(0);
    // No one left active, so the ride shell itself should cancel too.
    expect(updatedRide.status).toBe("CANCELLED");
  });

  test("a passenger cannot cancel someone else's membership", async () => {
    const owner = await createUser("passenger", "owner@test.com");
    const stranger = await createUser("passenger", "stranger@test.com");
    const { member } = await createRideWithMember(owner._id);

    await expect(
      rideStateService.cancelMembership({
        rideMemberId: member._id,
        passengerId: stranger._id,
      }),
    ).rejects.toThrow(/only cancel your own/i);
  });

  test("cannot cancel a ride that has already started", async () => {
    const passenger = await createUser("passenger", "cancel2@test.com");
    const { member } = await createRideWithMember(passenger._id, "STARTED");

    await expect(
      rideStateService.cancelMembership({
        rideMemberId: member._id,
        passengerId: passenger._id,
      }),
    ).rejects.toThrow(/already started/i);
  });

  test("cancelling one passenger does not affect another passenger in the same pool", async () => {
    const nusrat = await createUser("passenger", "poolnusrat@test.com");
    const rafiq = await createUser("passenger", "poolrafiq@test.com");

    const ride = await Ride.create({
      pickupZone: "DHANMONDI",
      status: "MATCHED",
      seatsTotal: 3,
      seatsTaken: 2,
    });
    const fare = calculateFare({ distanceKm: 3, isPooled: true });
    const nusratMember = await RideMember.create({
      ride: ride._id,
      passenger: nusrat._id,
      pickupZone: "DHANMONDI",
      dropoffZone: "FARMGATE",
      distanceKm: 3,
      status: "MATCHED",
      fareBreakdown: fare,
    });
    const rafiqMember = await RideMember.create({
      ride: ride._id,
      passenger: rafiq._id,
      pickupZone: "DHANMONDI",
      dropoffZone: "MIRPUR",
      distanceKm: 4,
      status: "MATCHED",
      fareBreakdown: fare,
    });

    await rideStateService.cancelMembership({
      rideMemberId: nusratMember._id,
      passengerId: nusrat._id,
    });

    const rafiqAfter = await RideMember.findById(rafiqMember._id);
    expect(rafiqAfter.status).toBe("MATCHED"); // untouched

    const rideAfter = await Ride.findById(ride._id);
    expect(rideAfter.status).toBe("MATCHED"); // still active, Rafiq remains
    expect(rideAfter.seatsTaken).toBe(1); // seat released for Nusrat only
  });
});
