import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cj_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // expired / invalid token -> go to login
    if (err.response?.status === 401 && localStorage.getItem("cj_token")) {
      localStorage.removeItem("cj_token");
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  e.response?.data?.message ||
  (e.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running on port 8080?" : e.message) ||
  "Something went wrong";

export default api;
