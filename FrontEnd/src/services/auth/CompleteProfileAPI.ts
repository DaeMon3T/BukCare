import BaseAPI from "../BaseAPI.js";

interface CompleteProfilePayload {
  user_id: string;
  sex: "male" | "female" | "other";
  dob: string; // e.g. "YYYY-MM-DD"
  contact_number: string;
  address_id: string;
  password: string;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  detail?: string;
  [key: string]: any;
}

/**
 * Complete the user profile after Google OAuth
 * @param payload - User profile details
 * @returns Promise containing response data
 */
export const completeProfile = async (
  payload: CompleteProfilePayload
): Promise<ApiResponse> => {
  try {
    const response = await BaseAPI.post<ApiResponse>("/auth/complete-profile", payload);
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to complete profile";
    throw new Error(message);
  }
};
