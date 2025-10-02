// src/services/SignupAPI.js (example name)
// ============================================================================
// Handles OTP sending, OTP verification, and completing signup
// ============================================================================

// Read base URL from Vite env
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function sendOTP(email) {
  try {
    const response = await fetch(`${API_BASE}/auth/send-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    let data = {};
    try { data = await response.json(); } catch {}

    if (!response.ok) {
      if (response.status === 400 && data.error?.includes("already exists")) {
        throw new Error("Email already exists. Please sign in instead.");
      }
      throw new Error(data.error || "Failed to send verification code");
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Network error. Please try again later.");
    }
    throw new Error(err.message || "Failed to send verification code");
  }
}

export async function verifyOTP(email, otp) {
  try {
    const response = await fetch(`${API_BASE}/auth/verify-otp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    let data = {};
    try { data = await response.json(); } catch {}

    if (!response.ok) {
      if (response.status === 400) {
        if (data.error?.includes("expired")) {
          throw new Error("Verification code has expired. Please request a new one.");
        } else if (data.error?.includes("Invalid")) {
          throw new Error("Invalid verification code. Please try again.");
        }
      }
      throw new Error(data.error || "Failed to verify code");
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Network error. Please try again later.");
    }
    throw new Error(err.message || "Failed to verify code");
  }
}

export async function completeSignup(userData) {
  try {
    const requestBody = {
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      first_name: userData.first_name,
      middle_name: userData.middle_name || null,
      last_name: userData.last_name,
      contact_number: userData.contact_number,
      password: userData.password,
      sex: userData.sex,
      date_of_birth: userData.date_of_birth,
      street: userData.street,
      barangay: userData.barangay,
      city_municipality: userData.city_municipality,
      province: userData.province,
      zip_code: userData.zip_code || null
    };

    const response = await fetch(`${API_BASE}/auth/complete-signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    let data = {};
    try { data = await response.json(); } catch {}

    if (!response.ok) {
      if (response.status === 400) {
        if (data.error?.includes("not verified")) {
          throw new Error("Email not verified. Please verify your email first.");
        } else if (data.error?.includes("already exists")) {
          throw new Error("Account with this email or phone already exists.");
        } else if (data.details) {
          const addressErrors = Object.values(data.details).flat();
          throw new Error(`Invalid data: ${addressErrors.join(', ')}`);
        }
      }
      throw new Error(data.error || "Failed to create account");
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Network error. Please try again later.");
    }
    throw new Error(err.message || "Failed to create account");
  }
}

export async function resendOTP(email) {
  return sendOTP(email);
}
