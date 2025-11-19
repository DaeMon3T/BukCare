// src/services/users/UsersAPI.ts
import BaseAPI from "../BaseAPI";

// ---------- Types ----------
export interface Address {
  province?: string;
  city?: string;
  barangay?: string;
}

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
  address?: Address;
}

// ---------- Profile APIs ----------

// Get current user profile
export const getUserProfile = async (): Promise<User> => {
  try {
    const res = await BaseAPI.get<User>("/auth/profile");

    // Ensure address always has all fields to prevent UI missing data
    const user = res.data;
    user.address = {
      province: user.address?.province || "",
      city: user.address?.city || "",
      barangay: user.address?.barangay || "",
    };

    return user;
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
  address?: Address;
}): Promise<User> => {
  try {
    // Always send full address structure to backend
    const payload = {
      ...data,
      address: {
        province: data.address?.province || "",
        city: data.address?.city || "",
        barangay: data.address?.barangay || "",
      },
    };

    const res = await BaseAPI.put<User>("/auth/profile", payload);
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
    formData.append("file", file);

    const res = await BaseAPI.put<User>("/auth/profile/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (onUpdate) onUpdate(res.data);
    return res.data;
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    throw err;
  }
};
