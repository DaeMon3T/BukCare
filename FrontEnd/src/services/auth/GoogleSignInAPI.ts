import BaseAPI from "../BaseAPI";

export interface GoogleSignInPayload {
  id_token: string;
}

export const googleSignIn = async (payload: GoogleSignInPayload) => {
  try {
    const response = await BaseAPI.post("/auth/google/signin/", payload);
    // unwrap 'data' if backend wraps it
    return response.data.data || response.data;
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    throw new Error(error.response?.data?.detail || "Google sign-in failed");
  }
};
