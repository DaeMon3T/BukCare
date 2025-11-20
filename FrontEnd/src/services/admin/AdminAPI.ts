import BaseAPI from "../BaseAPI.js";

// -----------------------------
// Type Definitions
// -----------------------------

export interface InviteUserParams {
  email: string;
  role: "doctor" | "staff";
}

export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  pending_approvals: number; // ✅ Changed from optional to required
  total_staff?: number;
  pending_invitations?: number;
  [key: string]: any;
}

export interface User {
  id: number | string; // ✅ Added id field
  user_id?: string; // Keep for backward compatibility
  email: string;
  fname: string;
  lname: string;
  role: string; // ✅ Changed from user_type to role (matches your backend)
  user_type?: string; // Keep for backward compatibility
  is_active?: boolean;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  warning?: string;
  message?: string;
  data?: T;
  [key: string]: any;
}

// -----------------------------
// Dashboard Stats
// -----------------------------

/**
 * Fetch dashboard stats (patients, doctors, staff, etc.)
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { data } = await BaseAPI.get("/admin/stats");

    return {
      total_patients: data.total_patients || 0,
      total_doctors: data.total_doctors || 0,
      pending_approvals: data.pending_doctors || 0,  // map API → UI
    };
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error(error.response?.data?.detail || error.message || "Failed to fetch dashboard stats");
  }
}

// -----------------------------
// Search Users
// -----------------------------

/**
 * Search for users by name or email
 * @param query - Search query string
 */
export async function searchUsers(query: string): Promise<ApiResponse<User[]>> {
  if (!query?.trim()) {
    return { data: [] }; // ✅ Return empty array instead of throwing error
  }

  try {
    const response = await BaseAPI.get<ApiResponse<User[]>>("/admin/search-users", {
      params: { query: query.trim() },
    });
    
    // ✅ Handle different response formats
    if (Array.isArray(response.data)) {
      // If API returns array directly
      return { data: response.data };
    } else if (response.data?.data) {
      // If API returns { data: [...] }
      return response.data;
    } else {
      // Fallback
      return { data: [] };
    }
  } catch (error: any) {
    console.error("User search failed:", error);
    // ✅ Return empty result instead of throwing
    return { data: [] };
  }
}

// -----------------------------
// Export
// -----------------------------

export default {
  getDashboardStats,
  searchUsers,
};