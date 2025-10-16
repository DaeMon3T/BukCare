// src/services/auth/ForgotPasswordAPI.ts
import BaseAPI from "../BaseAPI.js";

// Type Definitions
export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  detail?: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  email?: string[];
}

/**
 * Send forgot password request to API
 * @param email - User's email address
 * @returns API response
 */
export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await BaseAPI.post<ForgotPasswordResponse>(
      "/auth/forgot-password/", 
      { email } as ForgotPasswordRequest
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || 
      error.response?.data?.message || 
      error.message || 
      "Failed to send reset link";
    throw new Error(message);
  }
};