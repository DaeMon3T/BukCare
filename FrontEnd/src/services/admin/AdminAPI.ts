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
// Invite User
// -----------------------------

/**
 * Invite a user (doctor or staff)
 * @param userData - User data containing email and role
 */
export async function inviteUser({ email, role }: InviteUserParams): Promise<ApiResponse> {
  if (!email?.trim()) throw new Error("Email is required");
  if (!role) throw new Error("Role is required");

  try {
    const { data } = await BaseAPI.post<ApiResponse>("/admin/invite", { email, role });

    // Handle email sending warnings
    if (data.warning || (data.message && data.message.toLowerCase().includes("failed to send email"))) {
      console.warn("Invitation created but email sending failed:", data.message);
      return {
        success: true,
        warning: data.message || "Invitation created but email notification failed to send",
        ...data,
      };
    }

    return data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || 
      error.response?.data?.message || 
      error.message;

    // Specific error handling
    if (error.response?.status === 400) {
      if (message.toLowerCase().includes("already exists"))
        throw new Error("A user with this email already exists");
      if (message.toLowerCase().includes("pending invitation"))
        throw new Error("A pending invitation already exists for this email");
    }

    throw new Error(message || "Failed to invite user");
  }
}

// -----------------------------
// Dashboard Stats
// -----------------------------

/**
 * Fetch dashboard stats (patients, doctors, staff, etc.)
 */
export async function getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
  try {
    const { data } = await BaseAPI.get<ApiResponse<DashboardStats>>("/admin/dashboard-stats");
    return data;
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
  inviteUser,
  getDashboardStats,
  searchUsers,
};