// src/services/BaseAPI.ts
import axios from "axios";

// FIXED: Use HTTPS and correct env variable name
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "https://api.bukcare.com/v1"
    : "http://localhost:8000/v1");

const BaseAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor
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

// Response interceptor: handle 401 and refresh token
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

// FIXED: API Interceptor class with HTTPS
class APIInterceptor {
  private baseURL: string;

  constructor() {
    // FIXED: Use correct env var and HTTPS for production
    this.baseURL = import.meta.env.VITE_API_BASE_URL ||
      (import.meta.env.PROD
        ? 'https://api.bukcare.com/v1'
        : 'http://localhost:8000/v1');

    // Ensure baseURL doesn't end with slash
    this.baseURL = this.baseURL.replace(/\/$/, '');
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const token = localStorage.getItem('access_token');

    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshSuccess = await this.refreshToken();

        if (refreshSuccess) {
          // Retry the request with new token
          return this.makeRequest(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/signin';
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }

  async patch(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
      } else {
        localStorage.clear();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.clear();
      return false;
    }
  }
}

// Export singleton instance
export const api = new APIInterceptor();
