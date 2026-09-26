import apiClient from "./client";

export async function registerUser(payload) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}
