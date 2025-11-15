import axios from "axios";

// ✅ Base URL (only adds /api/v1 if NOT already included)
let baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Prevent double "/api/v1/api/v1" issues
if (baseURL.endsWith("/")) baseURL = baseURL.slice(0, -1);
if (!baseURL.endsWith("/api/v1")) baseURL = `${baseURL}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// ✅ Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle expired tokens globally (auto-refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry only once if token expired (401)
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      try {
        // 🔁 Try refreshing token
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newAccessToken = refreshResponse.data.access_token;
        localStorage.setItem("access_token", newAccessToken);

        // Update headers
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.clear();
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
