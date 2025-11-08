// src/services/users/UsersAPI.ts
import BaseAPI from "../BaseAPI";

// ---------- Types ----------
export interface User {
  id: number;
  email: string;
  fname: string;
  lname: string;
  mname?: string;
  name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_profile_complete: boolean;
  created_at: string;
  last_login?: string;
}

export interface DoctorPending {
  doctor_id: number;
  user_id: number;
  name: string;
  email: string;
  license_number: string;
  years_of_experience: number;
  specializations: string[];
  created_at: string;
  prc_license_front?: string;
  prc_license_back?: string;
  prc_license_selfie?: string;
}

export interface AdminStats {
  total_users: number;
  total_doctors: number;
  total_patients: number;
  pending_doctors: number;
  total_appointments: number;
}

// ---------- Admin APIs ----------

// Get all users (with optional filters)
export const getAllUsers = async (params?: { role?: string; is_active?: boolean }): Promise<User[]> => {
  try {
    const res = await BaseAPI.get<User[]>("/users", { params });
    return res.data;
  } catch (err) {
    console.error("Error fetching all users:", err);
    throw err;
  }
};

// Get pending doctor list
export const getPendingDoctors = async (): Promise<DoctorPending[]> => {
  try {
    const res = await BaseAPI.get<DoctorPending[]>("/doctors/pending");
    return res.data;
  } catch (err) {
    console.error("Error fetching pending doctors:", err);
    throw err;
  }
};

// Approve doctor
export const approveDoctor = async (doctorId: number): Promise<{ message: string }> => {
  try {
    const res = await BaseAPI.put<{ message: string }>(`/doctors/${doctorId}/approve`);
    return res.data;
  } catch (err) {
    console.error("Error approving doctor:", err);
    throw err;
  }
};

// Reject doctor
export const rejectDoctor = async (doctorId: number, reason?: string): Promise<{ message: string }> => {
  try {
    const res = await BaseAPI.put<{ message: string }>(
      `/doctors/${doctorId}/reject`,
      reason ? { reason } : {}
    );
    return res.data;
  } catch (err) {
    console.error("Error rejecting doctor:", err);
    throw err;
  }
};

// Get admin dashboard stats
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const res = await BaseAPI.get<AdminStats>("/stats");
    return res.data;
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    throw err;
  }
};

// Update user active/inactive status
export const updateUserStatus = async (userId: number, is_active: boolean): Promise<{ message: string }> => {
  try {
    const res = await BaseAPI.put<{ message: string }>(
      `/users/${userId}/status`,
      {},
      { params: { is_active } }
    );
    return res.data;
  } catch (err) {
    console.error("Error updating user status:", err);
    throw err;
  }
};

// ---------- Patient/Profile APIs ----------

// Get current user profile
export const getUserProfile = async (): Promise<User> => {
  try {
    const res = await BaseAPI.get<User>("/auth/profile");
    return res.data;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw err;
  }
};

// Update current user profile
export const updateUserProfile = async (data: {
  fname?: string;
  mname?: string;
  lname?: string;
  dob?: string;
  contact_number?: string;
  email?: string;
}): Promise<User> => {
  try {
    const res = await BaseAPI.put<User>("/auth/profile", data);
    return res.data;
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw err;
  }
};

// Upload or update profile picture
export const updateProfilePicture = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("picture", file);

    const res = await BaseAPI.post("/auth/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Assuming API returns { picture_url: "https://..." }
    return res.data.picture_url;
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    throw err;
  }
};
