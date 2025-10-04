// src/services/auth/GoogleSignUpAPI.js
import BaseAPI from "../BaseAPI";

export async function googleSignUp(idToken) {
  try {
    const response = await BaseAPI.post("/auth/google", {
      id_token: idToken,
    });

    return response.data; // Axios wraps the response in `data`
  } catch (error) {
    // Extract backend error message if available
    const message =
      error.response?.data?.detail || error.message || "Google signup failed";
    throw new Error(message);
  }
}
