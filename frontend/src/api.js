// src/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
});

// Defensive request interceptor — always return a config object
API.interceptors.request.use(
  (cfg) => {
    try {
      // ensure cfg and headers exist
      cfg = cfg || {};
      cfg.headers = cfg.headers || {};
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      // don't crash the whole app if something weird happens here
      // keep the original cfg shape so axios can continue
      // eslint-disable-next-line no-console
      console.warn("api request interceptor error:", e && e.message ? e.message : e);
    }
    return cfg;
  },
  (err) => Promise.reject(err)
);

// Optional: small response interceptor so errors show in a single shape
API.interceptors.response.use(
  (res) => res,
  (err) => {
    // eslint-disable-next-line no-console
    console.error("API response error:", err && err.message ? err.message : err);
    return Promise.reject(err);
  }
);

export { API };
export default API;
