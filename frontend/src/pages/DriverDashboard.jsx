import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyTeslas, createTesla } from "../api/teslas";
import {
  getAvailableRides,
  matchRide,
  getDriverRides,
  advanceRideStatus,
} from "../api/rides";
import { COLORS, fontDisplay, STATUS_STYLES } from "../theme";

const NEXT_STATUS = {
  MATCHED: "DRIVER_ARRIVED",
  DRIVER_ARRIVED: "STARTED",
  STARTED: "COMPLETED",
};
const NEXT_LABEL = {
  MATCHED: "Mark Driver Arrived",
  DRIVER_ARRIVED: "Start Trip",
  STARTED: "Complete Trip",
};

export default function DriverDashboard() {
  const { user, logout } = useAuth();

  const [teslas, setTeslas] = useState([]);
  const [teslasLoading, setTeslasLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    nickname: "",
    plateNumber: "",
    capacity: 3,
  });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [availableRides, setAvailableRides] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(true);
  const [matchingRideId, setMatchingRideId] = useState(null);
  const [selectedTeslaByRide, setSelectedTeslaByRide] = useState({});

  const [driverRides, setDriverRides] = useState([]);
  const [driverRidesLoading, setDriverRidesLoading] = useState(true);
  const [advancingId, setAdvancingId] = useState(null);

  async function loadTeslas() {
    setTeslasLoading(true);
    try {
      const data = await getMyTeslas();
      setTeslas(data);
    } catch (err) {
      console.error("Failed to load Teslas", err);
    } finally {
      setTeslasLoading(false);
    }
  }

  async function loadAvailableRides() {
    setAvailableLoading(true);
    try {
      const data = await getAvailableRides();
      setAvailableRides(data);
    } catch (err) {
      console.error("Failed to load available rides", err);
    } finally {
      setAvailableLoading(false);
    }
  }

  async function loadDriverRides() {
    setDriverRidesLoading(true);
    try {
      const data = await getDriverRides();
      setDriverRides(data);
    } catch (err) {
      console.error("Failed to load driver rides", err);
    } finally {
      setDriverRidesLoading(false);
    }
  }

  useEffect(() => {
    loadTeslas();
    loadAvailableRides();
    loadDriverRides();
  }, []);

  async function handleAddTesla(e) {
    e.preventDefault();
    setAddError("");
    setAdding(true);
    try {
      await createTesla({ ...form, capacity: Number(form.capacity) });
      setForm({ nickname: "", plateNumber: "", capacity: 3 });
      setShowAddForm(false);
      loadTeslas();
    } catch (err) {
      setAddError(err.response?.data?.error?.message || "Failed to add Tesla.");
    } finally {
      setAdding(false);
    }
  }

  async function handleMatch(rideId) {
    const teslaId = selectedTeslaByRide[rideId];
    if (!teslaId) {
      alert("Please select a Tesla first.");
      return;
    }
    setMatchingRideId(rideId);
    try {
      await matchRide(rideId, teslaId);
      loadAvailableRides();
      loadDriverRides();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to match ride.");
    } finally {
      setMatchingRideId(null);
    }
  }

  async function handleAdvance(rideId, currentStatus) {
    const toStatus = NEXT_STATUS[currentStatus];
    if (!toStatus) return;
    setAdvancingId(rideId);
    try {
      await advanceRideStatus(rideId, toStatus);
      loadDriverRides();
    } catch (err) {
      alert(
        err.response?.data?.error?.message || "Failed to update ride status.",
      );
    } finally {
      setAdvancingId(null);
    }
  }

  const inputStyle = {
    backgroundColor: COLORS.surfaceMuted,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.ink,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span
            style={{ ...fontDisplay, color: COLORS.ink }}
            className="font-bold"
          >
            Dhaka Tesla<span style={{ color: COLORS.primary }}>Pool</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ color: COLORS.inkMuted }} className="text-sm">
            Hi, {user?.name?.split(" ")[0]}
          </span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{
              backgroundColor: COLORS.surfaceMuted,
              color: COLORS.inkMuted,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* My Teslas section */}
        <div className="flex items-center justify-between mb-4">
          <h1
            style={{ ...fontDisplay, color: COLORS.ink }}
            className="text-2xl font-semibold"
          >
            My Teslas
          </h1>
          <button
            onClick={() => setShowAddForm((s) => !s)}
            className="text-sm px-4 py-2 rounded-xl font-semibold"
            style={{ backgroundColor: COLORS.primary, color: "#06201A" }}
          >
            {showAddForm ? "Cancel" : "+ Add Tesla"}
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleAddTesla}
            className="rounded-2xl p-6 mb-6 flex flex-col gap-4"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.inkMuted }}
                >
                  Nickname
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bullet"
                  value={form.nickname}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nickname: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.inkMuted }}
                >
                  Plate Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="DHK-TESLA-02"
                  value={form.plateNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, plateNumber: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.inkMuted }}
                >
                  Capacity (seats)
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {addError && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: "#2B1618", color: COLORS.danger }}
              >
                {addError}
              </div>
            )}

            <button
              type="submit"
              disabled={adding}
              className="py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
              style={{ backgroundColor: COLORS.primary, color: "#06201A" }}
            >
              {adding ? "Adding..." : "Add Tesla"}
            </button>
          </form>
        )}

        {teslasLoading ? (
          <p style={{ color: COLORS.inkMuted }} className="text-sm">
            Loading your Teslas...
          </p>
        ) : teslas.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center mb-10"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p style={{ color: COLORS.inkMuted }} className="text-sm">
              You haven't registered a Tesla yet. Add one to start accepting
              rides.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {teslas.map((t) => (
              <div
                key={t._id}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div>
                  <p
                    style={{ ...fontDisplay, color: COLORS.ink }}
                    className="font-semibold"
                  >
                    {t.nickname}
                  </p>
                  <p
                    style={{ color: COLORS.inkMuted }}
                    className="text-xs mt-1"
                  >
                    {t.plateNumber} · {t.capacity} seats
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={
                    t.isActive
                      ? { backgroundColor: "#132B26", color: COLORS.primary }
                      : {
                          backgroundColor: COLORS.surfaceMuted,
                          color: COLORS.inkMuted,
                        }
                  }
                >
                  {t.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Available Rides section */}
        <h2
          style={{ ...fontDisplay, color: COLORS.ink }}
          className="text-xl font-semibold mb-4"
        >
          Available Ride Requests
        </h2>

        {availableLoading ? (
          <p style={{ color: COLORS.inkMuted }} className="text-sm mb-10">
            Loading available rides...
          </p>
        ) : availableRides.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center mb-10"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p style={{ color: COLORS.inkMuted }} className="text-sm">
              No open ride requests right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 mb-10">
            {availableRides.map((ride) => (
              <div
                key={ride._id}
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p
                      style={{ ...fontDisplay, color: COLORS.ink }}
                      className="font-medium"
                    >
                      Pickup: {ride.pickupZone}
                    </p>
                    <p
                      style={{ color: COLORS.inkMuted }}
                      className="text-xs mt-1"
                    >
                      {ride.seatsTaken} passenger
                      {ride.seatsTaken !== 1 ? "s" : ""} waiting
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeslaByRide[ride._id] || ""}
                      onChange={(e) =>
                        setSelectedTeslaByRide((prev) => ({
                          ...prev,
                          [ride._id]: e.target.value,
                        }))
                      }
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{
                        backgroundColor: COLORS.surfaceMuted,
                        border: `1px solid ${COLORS.border}`,
                        color: COLORS.ink,
                      }}
                    >
                      <option value="">Choose Tesla...</option>
                      {teslas
                        .filter((t) => t.capacity >= ride.seatsTaken)
                        .map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.nickname} ({t.capacity} seats)
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => handleMatch(ride._id)}
                      disabled={matchingRideId === ride._id}
                      className="text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: "#06201A",
                      }}
                    >
                      {matchingRideId === ride._id ? "Matching..." : "Match"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Rides section */}
        <h2
          style={{ ...fontDisplay, color: COLORS.ink }}
          className="text-xl font-semibold mb-4"
        >
          My Rides
        </h2>

        {driverRidesLoading ? (
          <p style={{ color: COLORS.inkMuted }} className="text-sm">
            Loading your rides...
          </p>
        ) : driverRides.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p style={{ color: COLORS.inkMuted }} className="text-sm">
              You haven't matched any rides yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {driverRides.map(({ ride, members }) => {
              const status =
                STATUS_STYLES[ride.status] || STATUS_STYLES.REQUESTED;
              const nextLabel = NEXT_LABEL[ride.status];

              return (
                <div
                  key={ride._id}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderLeft: `3px solid ${status.color}`,
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                      <span
                        style={{ color: COLORS.ink }}
                        className="text-sm font-medium"
                      >
                        Pickup: {ride.pickupZone}
                      </span>
                    </div>

                    {nextLabel && (
                      <button
                        onClick={() => handleAdvance(ride._id, ride.status)}
                        disabled={advancingId === ride._id}
                        className="text-sm px-4 py-2 rounded-xl font-semibold disabled:opacity-60"
                        style={{
                          backgroundColor: COLORS.primary,
                          color: "#06201A",
                        }}
                      >
                        {advancingId === ride._id ? "Updating..." : nextLabel}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {members.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between text-sm px-3 py-2 rounded-lg"
                        style={{ backgroundColor: COLORS.surfaceMuted }}
                      >
                        <span style={{ color: COLORS.ink }}>
                          {m.passenger?.name} · {m.pickupZone} → {m.dropoffZone}
                        </span>
                        <span
                          style={{ color: COLORS.primary }}
                          className="font-semibold"
                        >
                          ৳{(m.fareBreakdown.totalFarePoysha / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
