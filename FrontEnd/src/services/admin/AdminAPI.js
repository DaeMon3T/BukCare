import BaseAPI from "../BaseAPI";

/**
 * Invite a user (doctor or staff)
 * @param {Object} userData - User data containing email and role
 * @param {string} userData.email - User's email to invite
 * @param {string} userData.role - User's role ('doctor' or 'staff')
 */
async function inviteUser({ email, role }) {
  if (!email) throw new Error("Email is required");
  if (!role) throw new Error("Role is required");

  try {
    const { data } = await BaseAPI.post("/admin/invite", { email, role });

    // Handle partial success: invitation created but email failed
    if (data.warning || (data.message && data.message.includes("failed to send email"))) {
      console.warn("Invitation created but email sending failed:", data.message);
      return {
        success: true,
        warning: data.message || "Invitation created but email notification failed to send",
        ...data,
      };
    }

    return data;
  } catch (error) {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message;

    if (error.response?.status === 400) {
      if (message.includes("already exists")) throw new Error("A user with this email already exists");
      if (message.includes("pending invitation")) throw new Error("A pending invitation already exists for this email");
    }

    throw new Error(message);
  }
}

/**
 * Fetch dashboard stats (patients, doctors, staff, etc.)
 */
async function getDashboardStats() {
  try {
    const { data } = await BaseAPI.get("/admin/dashboard-stats");
    return data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || error.message);
  }
}



/**
 * Search for users by name or email
 * @param {string} query - Search query string
 */
async function searchUsers(query) {
  try {
    const { data } = await BaseAPI.get("/admin/search-users", {
      params: { query }
    });
    return data;
  } catch (error) {
    console.error("User search failed:", error);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

export default {
  inviteUser,
  getDashboardStats,
  searchUsers,
};