import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getZones,
  requestRide,
  getMyRides,
  cancelRideMembership,
} from "../api/rides";
import { COLORS, fontDisplay, STATUS_STYLES } from "../theme";

export default function PassengerDashboard() {
  const { user, logout } = useAuth();
  const [zones, setZones] = useState([]);
  const [pickupZone, setPickupZone] = useState("");
  const [dropoffZone, setDropoffZone] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const [rides, setRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    getZones()
      .then((z) => setZones(z))
      .catch(() => setZones([]));
  }, []);

  async function loadRides() {
    setRidesLoading(true);
    try {
      const data = await getMyRides();
      setRides(data);
    } catch (err) {
      console.error("Failed to load rides", err);
    } finally {
      setRidesLoading(false);
    }
  }

  useEffect(() => {
    loadRides();
  }, []);

  async function handleRequestRide(e) {
    e.preventDefault();
    setRequestError("");
    setRequestSuccess("");

    if (pickupZone === dropoffZone) {
      setRequestError("Pickup and dropoff zones must be different.");
      return;
    }

    setRequesting(true);
    try {
      await requestRide({ pickupZone, dropoffZone });
      setRequestSuccess("Ride requested! Check your rides below.");
      setPickupZone("");
      setDropoffZone("");
      loadRides();
    } catch (err) {
      setRequestError(
        err.response?.data?.error?.message || "Failed to request ride.",
      );
    } finally {
      setRequesting(false);
    }
  }

  async function handleCancel(memberId) {
    if (!confirm("Cancel this ride request?")) return;
    setCancellingId(memberId);
    try {
      await cancelRideMembership(
        memberId,
        "Passenger cancelled from dashboard",
      );
      loadRides();
    } catch (err) {
      alert(err.response?.data?.error?.message || "Failed to cancel.");
    } finally {
      setCancellingId(null);
    }
  }

  function formatTaka(poysha) {
    return `৳${(poysha / 100).toFixed(2)}`;
  }

  const selectStyle = {
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

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1
          style={{ ...fontDisplay, color: COLORS.ink }}
          className="text-2xl font-semibold mb-1"
        >
          Where are you headed?
        </h1>
        <p style={{ color: COLORS.inkMuted }} className="text-sm mb-6">
          We'll pool you with someone nearby to split the fare.
        </p>

        <div
          className="rounded-2xl p-6 mb-10"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <form onSubmit={handleRequestRide} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.inkMuted }}
                >
                  Pickup Zone
                </label>
                <select
                  required
                  value={pickupZone}
                  onChange={(e) => setPickupZone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={selectStyle}
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.charAt(0) + z.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: COLORS.inkMuted }}
                >
                  Dropoff Zone
                </label>
                <select
                  required
                  value={dropoffZone}
                  onChange={(e) => setDropoffZone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={selectStyle}
                >
                  <option value="">Select zone...</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.charAt(0) + z.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {requestError && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: "#2B1618", color: COLORS.danger }}
              >
                {requestError}
              </div>
            )}
            {requestSuccess && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: "#132B26", color: COLORS.primary }}
              >
                {requestSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={requesting}
              className="py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
              style={{ backgroundColor: COLORS.primary, color: "#06201A" }}
            >
              {requesting ? "Requesting..." : "Request Ride"}
            </button>
          </form>
        </div>

        <h2
          style={{ ...fontDisplay, color: COLORS.ink }}
          className="text-xl font-semibold mb-4"
        >
          My Rides
        </h2>

        {ridesLoading ? (
          <p style={{ color: COLORS.inkMuted }} className="text-sm">
            Loading your rides...
          </p>
        ) : rides.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <p style={{ color: COLORS.inkMuted }} className="text-sm">
              No rides yet — request one above to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {rides.map((member) => {
              const status =
                STATUS_STYLES[member.status] || STATUS_STYLES.REQUESTED;
              const ride = member.ride;
              const canCancel = [
                "REQUESTED",
                "MATCHED",
                "DRIVER_ARRIVED",
              ].includes(member.status);

              return (
                <div
                  key={member._id}
                  className="rounded-2xl p-5"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderLeft: `3px solid ${status.color}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: status.bg,
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p style={{ color: COLORS.ink }} className="font-medium">
                        {member.pickupZone} → {member.dropoffZone}
                      </p>
                      <p
                        style={{ color: COLORS.inkMuted }}
                        className="text-xs mt-1"
                      >
                        {member.distanceKm} km
                        {ride?.driver && (
                          <>
                            {" "}
                            · Driver: {ride.driver.name}{" "}
                            {ride?.tesla ? `(${ride.tesla.nickname})` : ""}
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        style={{ ...fontDisplay, color: COLORS.primary }}
                        className="text-lg font-bold"
                      >
                        {formatTaka(member.fareBreakdown.totalFarePoysha)}
                      </p>
                      {member.fareBreakdown.poolDiscountPoysha > 0 && (
                        <p
                          style={{ color: COLORS.inkMuted }}
                          className="text-xs"
                        >
                          Pool discount: -
                          {formatTaka(member.fareBreakdown.poolDiscountPoysha)}
                        </p>
                      )}
                    </div>
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(member._id)}
                      disabled={cancellingId === member._id}
                      className="mt-4 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-60"
                      style={{
                        backgroundColor: "#2B1618",
                        color: COLORS.danger,
                      }}
                    >
                      {cancellingId === member._id
                        ? "Cancelling..."
                        : "Cancel Ride"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
