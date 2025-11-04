import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 15000,
});

// Automatically attach token if available
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch (err) {
      console.warn("Token read error:", err.message);
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error.message);
    return Promise.reject(error);
  }
);


// Global response interceptor (for debugging or auth errors)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `API Error [${error.response.status}]: ${error.response.config.url}`
      );
    } else {
      console.error("Network or CORS error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default API;
