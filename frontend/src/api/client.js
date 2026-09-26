import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the JWT (if we have one) to every outgoing request automatically.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("dtp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever responds with 401 (expired/invalid token), clear
// our stored session so the app doesn't keep sending a dead token.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("dtp_token");
      localStorage.removeItem("dtp_user");
    }
    return Promise.reject(error);
  },
);

export default apiClient;
