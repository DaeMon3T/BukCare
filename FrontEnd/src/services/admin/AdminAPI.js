// src/services/admin/AdminAPI.js

const BASE_URL = "http://localhost:8000/api/v1/admin";

/**
 * Helper to attach authorization headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem("access_token"); // token saved after login
  if (!token) throw new Error("No access token found. Please login first.");
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

/**
 * Invite a user (doctor or staff)
 * @param {Object} userData - User data containing email and role
 * @param {string} userData.email - User's email to invite
 * @param {string} userData.role - User's role ('doctor' or 'staff')
 */
async function inviteUser({ email, role }) {
  if (!role) throw new Error("Role is required to invite a user");

  // Unified backend endpoint
  const endpoint = '/invite/';

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, role }), // role explicitly sent
    });

    const data = await res.json();

    if (!res.ok) {
      // Handle specific error cases
      if (res.status === 400) {
        if (data.detail?.includes('already exists') || data.message?.includes('already exists')) {
          throw new Error('A user with this email already exists');
        }
        if (data.detail?.includes('pending invitation') || data.message?.includes('pending invitation')) {
          throw new Error('A pending invitation already exists for this email');
        }
      }
      throw new Error(data.detail || data.message || `Server error (${res.status})`);
    }

    // Partial success (invitation created but email failed)
    if (data.warning || (data.message && data.message.includes('failed to send email'))) {
      console.warn('Invitation created but email sending failed:', data.message);
      return {
        success: true,
        warning: data.message || 'Invitation created but email notification failed to send',
        ...data
      };
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

export default {
  inviteUser,
};
