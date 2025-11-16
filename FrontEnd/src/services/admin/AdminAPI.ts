import BaseAPI from "../BaseAPI.js";

// -----------------------------
// Type Definitions
// -----------------------------

export interface InviteUserParams {
  email: string;
  role: "doctor" | "staff";
}

export interface DashboardStats {
  total_patients?: number;
  total_doctors?: number;
  total_staff?: number;
  pending_invitations?: number;
  [key: string]: any;
}

export interface User {
  user_id: string;
  email: string;
  fname: string;
  lname: string;
  user_type: string;
  is_active: boolean;
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
      total_patients: data.total_patients,
      total_doctors: data.total_doctors,
      pending_approvals: data.pending_doctors,  // map API → UI
    };
  } catch (error: any) {
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
    throw new Error("Search query is required");
  }

  try {
    const { data } = await BaseAPI.get<ApiResponse<User[]>>("/admin/search-users", {
      params: { query: query.trim() },
    });
    return data;
  } catch (error: any) {
    console.error("User search failed:", error);
    throw new Error(error.response?.data?.detail || error.message || "User search failed");
  }
}

// -----------------------------
// Export
// -----------------------------

export default {
  
  getDashboardStats,
  searchUsers,
};