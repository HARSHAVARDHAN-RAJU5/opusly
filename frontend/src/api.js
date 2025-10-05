import axios from "axios";

// ✅ Change this to your backend URL if hosted remotely
export const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically include token for every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
