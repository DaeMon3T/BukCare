// src/services/auth/ForgotPasswordAPI.ts
import BaseAPI from "../BaseAPI.js";

/**
 * Send forgot password request to API
 * @param email - User's email address
 * @returns API response
 */
export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const response = await BaseAPI.post("/auth/forgot-password/", { email });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.message || error.message || "Failed to send reset link";
    throw new Error(message);
  }
};
