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
  picture?: string;
  created_at: string;
  last_login?: string;
}

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

// Update current user profile (without picture)
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
export const updateProfilePicture = async (
  file: File,
  onUpdate?: (user: User) => void // optional callback to update AuthContext
): Promise<User> => {
  try {
    const formData = new FormData();
    formData.append("file", file); // match FastAPI PUT parameter

    const res = await BaseAPI.put<User>("/auth/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Update AuthContext if callback provided
    if (onUpdate) onUpdate(res.data);

    return res.data;
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    throw err;
  }
};
