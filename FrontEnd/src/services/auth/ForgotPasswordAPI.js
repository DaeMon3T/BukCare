// src/services/auth/ForgotPasswordAPI.js
import BaseAPI from "../BaseAPI";

/**
 * Send forgot password request to API
 * @param {string} email - User's email address
 * @returns {Promise<Object>} API response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await BaseAPI.post("/auth/forgot-password/", { email });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Failed to send reset link";
    throw new Error(message);
  }
};
