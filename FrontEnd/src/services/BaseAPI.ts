// src/services/BaseAPI.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const BaseAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor: Add auth token to requests
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

// Response interceptor: Handle 401 errors for authenticated routes only
BaseAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response, config } = error;
    
    if (response?.status === 401) {
      const isAuthEndpoint = config?.url?.includes('/auth/');
      
      if (!isAuthEndpoint) {
        localStorage.clear();
        window.location.href = '/signin';
      }
    }
    
    return Promise.reject(error);
  }
);

export default BaseAPI;