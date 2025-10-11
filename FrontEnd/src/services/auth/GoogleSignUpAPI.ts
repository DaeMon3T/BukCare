// src/services/auth/GoogleSignUpAPI.ts
import BaseAPI from "../BaseAPI.js";

export interface GoogleSignUpResponse {
  access_token: string;
  refresh_token: string;
  user: {
    user_id: string;
    email: string;
    name?: string;
    fname?: string;
    lname?: string;
    picture?: string;
    user_type: string;
    is_profile_complete: boolean;
  };
}

export async function googleSignUp(idToken: string): Promise<GoogleSignUpResponse> {
  try {
    const response = await BaseAPI.post<GoogleSignUpResponse>("/auth/google", {
      id_token: idToken,
    });

    return response.data; // Axios wraps the response in `data`
  } catch (error: any) {
    // Extract backend error message if available
    const message =
      error.response?.data?.detail || error.message || "Google signup failed";
    throw new Error(message);
  }
}