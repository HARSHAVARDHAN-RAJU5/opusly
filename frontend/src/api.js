// src/api.js
import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api", // <-- backend base
  timeout: 10000, // 10s, helps reveal hanging requests
});

// attach token automatically if available
API.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
