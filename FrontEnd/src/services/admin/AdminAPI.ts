import BaseAPI from "../BaseAPI.js";

interface InviteUserParams {
  email: string;
  role: "doctor" | "staff";
}

interface ApiResponse<T = any> {
  success?: boolean;
  warning?: string;
  message?: string;
  data?: T;
  [key: string]: any;
}

/**
 * Invite a user (doctor or staff)
 * @param userData - User data containing email and role
 */
export async function inviteUser({ email, role }: InviteUserParams): Promise<ApiResponse> {
  if (!email) throw new Error("Email is required");
  if (!role) throw new Error("Role is required");

  try {
    const { data } = await BaseAPI.post<ApiResponse>("/admin/invite", { email, role });

    if (data.warning || (data.message && data.message.includes("failed to send email"))) {
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
      error.response?.data?.detail || error.response?.data?.message || error.message;

    if (error.response?.status === 400) {
      if (message.includes("already exists"))
        throw new Error("A user with this email already exists");
      if (message.includes("pending invitation"))
        throw new Error("A pending invitation already exists for this email");
    }

    throw new Error(message);
  }
}

/**
 * Fetch dashboard stats (patients, doctors, staff, etc.)
 */
export async function getDashboardStats(): Promise<ApiResponse> {
  try {
    const { data } = await BaseAPI.get<ApiResponse>("/admin/dashboard-stats");
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || error.message);
  }
}

/**
 * Search for users by name or email
 * @param query - Search query string
 */
export async function searchUsers(query: string): Promise<ApiResponse> {
  try {
    const { data } = await BaseAPI.get<ApiResponse>("/admin/search-users", {
      params: { query },
    });
    return data;
  } catch (error: any) {
    console.error("User search failed:", error);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

export default {
  inviteUser,
  getDashboardStats,
  searchUsers,
};
