import BaseAPI from "../BaseAPI";

export interface GoogleSignUpResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  user: {
    user_id: string;
    email: string;
    name?: string;
    fname?: string;
    lname?: string;
    picture?: string;
    user_type: string;
    is_profile_complete: boolean;
    role: string;
    is_verified: boolean;
  };
}

export async function googleSignUp(idToken: string): Promise<GoogleSignUpResponse> {
  try {
    const response = await BaseAPI.post<GoogleSignUpResponse>("/auth/google/signup", {
      id_token: idToken,
    });
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail || error.message || "Google signup failed";
    throw new Error(message);
  }
}
