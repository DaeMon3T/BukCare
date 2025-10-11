import axios from "axios";

const API_URL = "http://localhost:8000/api/v1"; // adjust to your backend

// Type Definitions
export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  profile_picture?: string;
  is_profile_complete: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface UpdateProfileResponse {
  user: UserProfile;
  message: string;
}

export interface UpdatePictureResponse {
  picture: string;
  message: string;
}

// Get user profile
export const getUserProfile = async (userId: number): Promise<UserProfile> => {
  try {
    const res = await axios.get<UserProfile>(`${API_URL}/users/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user profile", err);
    throw err;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: number, 
  data: UpdateProfileData
): Promise<UpdateProfileResponse> => {
  try {
    const res = await axios.put<UpdateProfileResponse>(`${API_URL}/users/${userId}`, data);
    return res.data;
  } catch (err) {
    console.error("Error updating user profile", err);
    throw err;
  }
};

// Update profile picture
export const updateProfilePicture = async (
  userId: number, 
  file: File
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("picture", file);

    const res = await axios.put<UpdatePictureResponse>(
      `${API_URL}/users/${userId}/picture`, 
      formData, 
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data.picture; // return new picture URL
  } catch (err) {
    console.error("Error updating profile picture", err);
    throw err;
  }
};