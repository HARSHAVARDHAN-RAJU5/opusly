// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
});

API.interceptors.request.use(
  (cfg) => {
    try {
      cfg = cfg || {};
      cfg.headers = cfg.headers || {};
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.warn("api request interceptor error:", e && e.message ? e.message : e);
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

API.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API response error:", err && err.message ? err.message : err);
    return Promise.reject(err);
  }
);

export { API };
export default API;
