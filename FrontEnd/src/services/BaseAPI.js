// src/services/BaseAPI.js
import axios from "axios";

const API_URL = "http://localhost:8000/api/v1"; // adjust for your backend

// Create an Axios instance for reusability
const BaseAPI = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add request/response interceptors for auth tokens
// BaseAPI.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

export default BaseAPI;
