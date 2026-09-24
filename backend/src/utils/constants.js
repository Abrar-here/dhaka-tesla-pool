// Simplified Dhaka geography — a fixed list of named zones instead of
// real map/routing APIs. Each zone carries an approximate lat/long
// centroid so we can compute a straight-line distance for the fare model
// without any map API.
const DHAKA_ZONES = {
  BANANI: { lat: 23.7937, lng: 90.4066 },
  GULSHAN: { lat: 23.7925, lng: 90.4078 },
  MOHAKHALI: { lat: 23.7788, lng: 90.4056 },
  DHANMONDI: { lat: 23.7461, lng: 90.3742 },
  MIRPUR: { lat: 23.8223, lng: 90.3654 },
  UTTARA: { lat: 23.8759, lng: 90.3795 },
  FARMGATE: { lat: 23.7562, lng: 90.3888 },
  BASHUNDHARA: { lat: 23.8151, lng: 90.4293 },
};

const ZONE_NAMES = Object.keys(DHAKA_ZONES);

// Ride-level lifecycle (the Tesla's trip as a whole)
const RIDE_STATUS = {
  REQUESTED: "REQUESTED",
  MATCHED: "MATCHED",
  DRIVER_ARRIVED: "DRIVER_ARRIVED",
  STARTED: "STARTED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

// Per-passenger membership lifecycle — same names, tracked independently
// so one passenger's cancellation doesn't have to affect another's ride.
const MEMBER_STATUS = { ...RIDE_STATUS };

// Legal forward transitions for the ride-level state machine.
// CANCELLED is reachable from any non-terminal state (handled separately
// in the service layer, not enumerated here).
const RIDE_TRANSITIONS = {
  REQUESTED: ["MATCHED", "CANCELLED"],
  MATCHED: ["DRIVER_ARRIVED", "CANCELLED"],
  DRIVER_ARRIVED: ["STARTED", "CANCELLED"],
  STARTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const PAYMENT_METHOD = { CASH: "CASH", WALLET: "WALLET" };
const PAYMENT_STATUS = { PENDING: "PENDING", PAID: "PAID" };

// Fare model constants — all money in integer poysha (1 Taka = 100 poysha)
const FARE = {
  BASE_FARE_POYSHA: 3000, // 30 Taka
  PER_KM_RATE_POYSHA: 1500, // 15 Taka/km
  POOL_DISCOUNT_PERCENT: 20, // applied when >1 passenger shares the ride
};

module.exports = {
  DHAKA_ZONES,
  ZONE_NAMES,
  RIDE_STATUS,
  MEMBER_STATUS,
  RIDE_TRANSITIONS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  FARE,
};
