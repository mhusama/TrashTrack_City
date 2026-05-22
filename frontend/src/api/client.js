import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

export const reportsApi = {
  list: () => api.get("/api/reports"),
  get: (id) => api.get(`/api/reports/${id}`),
  create: (formData) =>
    api.post("/api/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStatus: (id, status) =>
    api.patch(`/api/reports/${id}/status`, { status }),
  remove: (id) => api.delete(`/api/reports/${id}`),
};
