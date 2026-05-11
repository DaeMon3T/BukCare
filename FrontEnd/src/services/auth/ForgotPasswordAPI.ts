import BaseAPI from "../BaseAPI.js";

export interface ForgotPasswordResponse {
  message: string;
  detail?: string;
}

export interface ApiError {
  detail?: string;
  message?: string;
  email?: string[];
}

// Step 1 — Request OTP (with Turnstile)
export const forgotPassword = async (
  email: string,
  cf_turnstile_response: string
): Promise<ForgotPasswordResponse> => {
  const response = await BaseAPI.post("/auth/password-reset/request", {
    email,
    cf_turnstile_response,
  });
  return response.data;
};

// Step 2 — Verify OTP (no Turnstile needed)
export const verifyOtp = async (email: string, otp: string): Promise<ForgotPasswordResponse> => {
  const response = await BaseAPI.post("/auth/password-reset/verify", { email, otp });
  return response.data;
};

// Step 3 — Confirm new password (no Turnstile needed)
export const resetPassword = async (email: string, new_password: string): Promise<ForgotPasswordResponse> => {
  const response = await BaseAPI.post("/auth/password-reset/confirm", { email, new_password });
  return response.data;
};