import axios from "axios";

const API_URL = "http://localhost:8000/api/v1"; // adjust to your backend

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const res = await axios.get(`${API_URL}/users/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user profile", err);
    throw err;
  }
};

// Update user profile
export const updateUserProfile = async (userId, data) => {
  try {
    const res = await axios.put(`${API_URL}/users/${userId}`, data);
    return res.data;
  } catch (err) {
    console.error("Error updating user profile", err);
    throw err;
  }
};

// Update profile picture
export const updateProfilePicture = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append("picture", file);

    const res = await axios.put(`${API_URL}/users/${userId}/picture`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.picture; // return new picture URL
  } catch (err) {
    console.error("Error updating profile picture", err);
    throw err;
  }
};
