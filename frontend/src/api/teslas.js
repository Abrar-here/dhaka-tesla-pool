import apiClient from "./client";

export async function createTesla(payload) {
  const { data } = await apiClient.post("/teslas", payload);
  return data.tesla;
}

export async function getMyTeslas() {
  const { data } = await apiClient.get("/teslas/mine");
  return data.teslas;
}
