# Database Schema — Dhaka Tesla Pool

We use **MongoDB** with **Mongoose**. Even though MongoDB is document-oriented,
we deliberately model this domain with **normalized, relationship-style
collections** (references via ObjectId) rather than deep embedding, because:

- Rides, pools, and users are updated independently and concurrently
  (e.g. two passengers racing for the last seat) — embedding would force us
  to rewrite large documents on every small change and make atomic
  seat-capacity checks harder.
- We need to query "all rides for a driver", "all rides for a passenger",
  and "all members of a pool" independently and efficiently — reference +
  index is a better fit than embedding for these access patterns.
- History/audit records must never be lost or overwritten, so they live in
  their own append-only collection.

## Collections

### 1. `users`

Represents both passengers and drivers (role-based, single collection —
simpler auth, and a user could in theory be both in a real product).

| Field                    | Type                              | Notes                                                             |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------- |
| `_id`                    | ObjectId                          |                                                                   |
| `name`                   | String, required                  |                                                                   |
| `email`                  | String, required, unique, indexed | lowercase                                                         |
| `passwordHash`           | String, required                  | bcrypt                                                            |
| `role`                   | Enum: `passenger`, `driver`       | required                                                          |
| `phone`                  | String                            |                                                                   |
| `walletBalancePoysha`    | Integer                           | for simulated TeslaPay, stored in **poysha** (integer), default 0 |
| `createdAt`, `updatedAt` | Date                              | timestamps                                                        |

**Why integer poysha, not decimal Taka?**
Floating point (e.g. JS `Number`) causes rounding errors in money math
(`0.1 + 0.2 !== 0.3`). We store the smallest currency unit as an integer
(1 Taka = 100 poysha), same principle as storing USD in cents. All fare
math happens in integers; we only convert to Taka (divide by 100) for
display. This avoids an entire class of financial bugs without needing a
decimal/bignum library for an MVP.

### 2. `teslas` (vehicles)

| Field                    | Type                                   | Notes                 |
| ------------------------ | -------------------------------------- | --------------------- |
| `_id`                    | ObjectId                               |                       |
| `driver`                 | ObjectId ref `User`, required, indexed |                       |
| `nickname`               | String, required                       | e.g. "Bullet"         |
| `plateNumber`            | String, required, unique               |                       |
| `capacity`               | Integer, required, min 1               | total seats, e.g. 3   |
| `isActive`               | Boolean, default true                  | driver can go offline |
| `createdAt`, `updatedAt` | Date                                   |                       |

### 3. `rides` (a ride request / pool)

A `ride` represents **one Tesla's trip instance** that can carry 1..N
passengers (a "pool"). Each passenger's individual request becomes a
`RideMember` (see below) attached to a `Ride`.

| Field                    | Type                                                  | Notes                                                |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------------- |
| `_id`                    | ObjectId                                              |                                                      |
| `tesla`                  | ObjectId ref `Tesla`, nullable until matched, indexed |                                                      |
| `driver`                 | ObjectId ref `User`, nullable until matched, indexed  | denormalized for fast lookup                         |
| `status`                 | Enum (see lifecycle below), indexed                   |                                                      |
| `seatsTotal`             | Integer                                               | snapshot of Tesla capacity at match time             |
| `seatsTaken`             | Integer, default 0                                    | **atomically incremented** — see concurrency section |
| `pickupZone`             | String (enum of Dhaka areas)                          | simplified geography                                 |
| `createdAt`, `updatedAt` | Date                                                  |                                                      |

**Ride lifecycle (status enum):**

REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
↘ CANCELLED (from any non-terminal state)

We kept the PRD's suggested lifecycle as-is because it already cleanly
separates "matching happened" (MATCHED) from "driver physically present"
(DRIVER_ARRIVED) from "trip in progress" (STARTED) — each maps to a
distinct real-world event and a distinct set of allowed actions, which is
exactly what a state machine should do.

### 4. `ridemembers` (pool membership — one row per passenger per ride)

This is the join table that lets one `Ride` (Tesla trip) carry multiple
passengers, each with **their own pickup/dropoff, fare, and status** —
directly satisfying "each passenger needs to see their own fare and their
own status, not anyone else's."

| Field           | Type                                                                                                  | Notes                                                                                        |
| --------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `_id`           | ObjectId                                                                                              |                                                                                              |
| `ride`          | ObjectId ref `Ride`, required, indexed                                                                |                                                                                              |
| `passenger`     | ObjectId ref `User`, required, indexed                                                                |                                                                                              |
| `pickupZone`    | String, required                                                                                      |                                                                                              |
| `dropoffZone`   | String, required                                                                                      |                                                                                              |
| `distanceKm`    | Number, required                                                                                      | straight-line estimate, simplified                                                           |
| `status`        | Enum: `REQUESTED, MATCHED, DRIVER_ARRIVED, STARTED, COMPLETED, CANCELLED`                             | can differ slightly from ride's overall status (e.g. one passenger cancels, others continue) |
| `fareBreakdown` | Embedded subdocument: `{ baseFarePoysha, distanceChargePoysha, poolDiscountPoysha, totalFarePoysha }` | computed once and frozen at MATCHED time                                                     |
| `paymentMethod` | Enum: `CASH`, `WALLET`                                                                                |                                                                                              |
| `paymentStatus` | Enum: `PENDING`, `PAID`                                                                               |                                                                                              |
| `joinedAt`      | Date                                                                                                  |                                                                                              |

Compound index: `{ ride: 1, passenger: 1 }` unique — a passenger can't join
the same ride twice.

### 5. `ridestatushistory` (audit trail)

Append-only log — satisfies "hold onto enough history to explain exactly
what happened."

| Field        | Type                                | Notes                    |
| ------------ | ----------------------------------- | ------------------------ |
| `_id`        | ObjectId                            |                          |
| `ride`       | ObjectId ref `Ride`, indexed        |                          |
| `rideMember` | ObjectId ref `RideMember`, nullable | null = ride-level event  |
| `fromStatus` | String                              |                          |
| `toStatus`   | String                              |                          |
| `actor`      | ObjectId ref `User`                 | who triggered it         |
| `reason`     | String, optional                    | e.g. cancellation reason |
| `createdAt`  | Date                                |                          |

## Concurrency: the "last seat" problem

**Scenario:** Bullet has 1 seat left. Nusrat and Shirin both try to claim it
within milliseconds; both read `seatsTaken: 2, seatsTotal: 3` before either
write lands.

**Our MVP solution — atomic conditional update, not read-then-write:**

```js
// WRONG (race condition): read seatsTaken, check in app code, then write
// RIGHT: let MongoDB's atomic findOneAndUpdate do the check-and-increment
const ride = await Ride.findOneAndUpdate(
  { _id: rideId, $expr: { $lt: ["$seatsTaken", "$seatsTotal"] } },
  { $inc: { seatsTaken: 1 } },
  { new: true },
);
if (!ride) throw new ConflictError("No seats available");
```

Because MongoDB executes `findOneAndUpdate` atomically at the document
level, only one of the two concurrent requests can match the filter and
succeed; the second one's filter fails (seatsTaken is already at capacity)
and it gets a clean `409 Conflict` instead of corrupting capacity. This
needs no external lock, distributed transaction, or Redis — a single
document's atomicity is the natural unit of consistency here.

**At larger scale**, we'd move to a dedicated seat-reservation service with
optimistic locks or a per-Tesla queue to serialize writes, plus idempotency
keys so retried client requests don't double-claim.

## Fare Model

passengerFare = baseFare + (distanceKm \* perKmRate) - poolDiscount

- `baseFare` = 30 Taka (3000 poysha) — flat pickup fee
- `perKmRate` = 15 Taka/km (1500 poysha)
- `poolDiscount` = 20% of (base + distance) **if** the passenger is sharing
  the ride with ≥1 other passenger, else 0

Worked example (Nusrat: Banani → Mohakhali, ~1.66 km, pooled with Rafiq):

base = 3000 poysha
distance = 1.66 _ 1500 = 2490 poysha
subtotal = 5490 poysha
poolDiscount = 20% _ 5490 = 1098 poysha
total = 5490 - 1098 = 4392 poysha = 43.92 Taka

This is fully deterministic and hand-verifiable. The formula lives in one
function (`services/fareService.js`) so it's easy to unit test and easy to
point to in the interview.

## Indexes summary

- `users.email` — unique
- `teslas.plateNumber` — unique
- `teslas.driver` — for "my vehicles" lookups
- `rides.status` — for matching queries ("find REQUESTED rides in zone X")
- `rides.driver` — driver's ride list
- `ridemembers.passenger` — passenger's ride list
- `ridemembers.{ride, passenger}` — unique compound, prevents duplicate join
- `ridestatushistory.ride` — audit lookup by ride
