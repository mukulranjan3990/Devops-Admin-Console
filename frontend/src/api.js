import axios from "axios";

// If VITE_API_BASE_URL is set (e.g., http://localhost:8080/api or AWS ALB URL), use it.
// In dev or container environments, relative "/api" works with proxy or direct routing.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor injecting JWT Bearer token into outgoing HTTP requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor catching 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional callback hook or broadcast if needed
    }
    return Promise.reject(error);
  }
);

export default api;
