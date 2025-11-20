import BaseAPI from "../BaseAPI";

// -----------------------------
// Type Definitions
// -----------------------------

export interface User {
  doctor_profile: {};
  picture: string;
  id: number;
  email: string;
  fname: string;
  lname: string;
  role: "admin" | "doctor" | "patient" | "pending";
  is_active: boolean;
  is_verified: boolean;
  is_profile_complete: boolean;
  created_at: string;
  last_login?: string;
}

// Generic API Response
export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// -----------------------------
// Users API
// -----------------------------

/**
 * Fetch all users (Admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await BaseAPI.get<User[]>("/admin/users"); 
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    throw new Error(error.response?.data?.detail || error.message || "Failed to fetch users");
  }
}

/**
 * Update a user's active status (Admin only)
 */
export async function updateUserStatus(userId: number, isActive: boolean): Promise<void> {
  try {
    await BaseAPI.put(`/admin/users/${userId}/status`, null, {
      params: { is_active: isActive },
    });
  } catch (error: any) {
    console.error("Failed to update user status:", error);
    throw new Error(error.response?.data?.detail || error.message || "Failed to update user status");
  }
}

/**
 * Approve a doctor (Admin only)
 */
export async function approveDoctor(doctorId: number): Promise<void> {
  try {
    await BaseAPI.put(`/admin/doctors/${doctorId}/approve`);
  } catch (error: any) {
    console.error("Failed to approve doctor:", error);
    throw new Error(error.response?.data?.detail || error.message || "Failed to approve doctor");
  }
}

/**
 * Reject a doctor (Admin only)
 */
export async function rejectDoctor(doctorId: number, reason?: string): Promise<void> {
  try {
    await BaseAPI.put(`/admin/doctors/${doctorId}/reject`, null, {
      params: reason ? { reason } : undefined,
    });
  } catch (error: any) {
    console.error("Failed to reject doctor:", error);
    throw new Error(error.response?.data?.detail || error.message || "Failed to reject doctor");
  }
}

// -----------------------------
// Export
// -----------------------------
const usersAPI = {
  getAllUsers,
  updateUserStatus,
  approveDoctor,
  rejectDoctor,
};

export default usersAPI;
