// src/services/auth/CompleteProfileAPI.js
import BaseAPI from "../BaseAPI";

/**
 * Complete the user profile after Google OAuth
 * @param {Object} payload - { user_id, sex, dob, contact_number, address_id, password }
 * @returns {Promise<Object>} response data
 */
export const completeProfile = async (payload) => {
  try {
    const response = await BaseAPI.post("/auth/complete-profile", payload);
    return response.data;
  } catch (error) {
    // Extract backend error message if available
    const message = error.response?.data?.detail || error.message || "Failed to complete profile";
    throw new Error(message);
  }
};
