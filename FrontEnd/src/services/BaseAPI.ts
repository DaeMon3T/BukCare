// src/services/BaseAPI.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/v1";

const BaseAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// ---------------------------
// Request interceptor
// ---------------------------
BaseAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------
// Response interceptor: handle 401 and refresh token
// ---------------------------
BaseAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // Only retry once
    if (response?.status === 401 && !config._retry) {
      config._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        // Call refresh token endpoint
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newAccessToken = refreshResponse.data.access_token;
        localStorage.setItem("access_token", newAccessToken);

        // Update headers for original request
        BaseAPI.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        config.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry original request
        return BaseAPI(config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default BaseAPI;
