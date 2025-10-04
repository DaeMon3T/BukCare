// src/services/BaseAPI.js
import axios from "axios";

// Use environment variable if defined, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

/**
 * Axios instance for API requests
 * Automatically sets JSON headers and can include auth token
 */
const BaseAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Request interceptor to include Authorization header
BaseAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Optional: Response interceptor for handling errors globally
BaseAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can add global error handling here
    return Promise.reject(error);
  }
);

export default BaseAPI;
