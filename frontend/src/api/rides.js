import apiClient from "./client";

export async function getZones() {
  const { data } = await apiClient.get("/rides/zones");
  return data.zones;
}

export async function requestRide(payload) {
  const { data } = await apiClient.post("/rides", payload);
  return data;
}

export async function getMyRides() {
  const { data } = await apiClient.get("/rides/mine");
  return data.rides;
}

export async function cancelRideMembership(memberId, reason) {
  const { data } = await apiClient.post(`/rides/members/${memberId}/cancel`, {
    reason,
  });
  return data;
}

export async function getAvailableRides() {
  const { data } = await apiClient.get("/rides/available");
  return data.rides;
}

export async function getDriverRides() {
  const { data } = await apiClient.get("/rides/driver/mine");
  return data.rides;
}

export async function matchRide(rideId, teslaId) {
  const { data } = await apiClient.post(`/rides/${rideId}/match`, { teslaId });
  return data;
}

export async function advanceRideStatus(rideId, toStatus) {
  const { data } = await apiClient.post(`/rides/${rideId}/advance`, {
    toStatus,
  });
  return data;
}

export async function getRideHistory(rideId) {
  const { data } = await apiClient.get(`/rides/${rideId}/history`);
  return data.history;
}
