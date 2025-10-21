import BaseAPI from "../BaseAPI";

/* ----------------------------------------
   🔐 Interfaces
---------------------------------------- */
export interface Credentials {
  email: string;
  password: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
}

export interface User {
  user_id: number;
  email: string;
  fname: string;
  lname: string;
  picture?: string;
  role: string;
  is_profile_complete: boolean;
  is_verified: boolean;
  is_active: boolean;
}

export interface AuthResponse {
  tokens: Tokens;
  user: User;
}

export interface GoogleSignInPayload {
  id_token: string;
}

/* ----------------------------------------
   ✉️ Email/Password Sign-In
---------------------------------------- */
export const signIn = async (credentials: Credentials): Promise<AuthResponse> => {
  try {
    const response = await BaseAPI.post<AuthResponse>("/auth/signin/", credentials);
    return response.data;
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw new Error(error.response?.data?.detail || "Sign in failed");
  }
};

/* ----------------------------------------
   🔑 Google Sign-In (One Tap or OAuth)
---------------------------------------- */
export const googleSignIn = async (payload: GoogleSignInPayload): Promise<AuthResponse> => {
  try {
    // ⬇️ Post to your backend Google sign-in endpoint
    const response = await BaseAPI.post<any>("/auth/google/signin/", payload);

    // Unwrap nested `data` (some backends wrap responses as { data: {...} })
    const data = response.data.data ?? response.data;

    return data as AuthResponse;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw new Error(error.response?.data?.detail || "Google sign-in failed");
  }
};
