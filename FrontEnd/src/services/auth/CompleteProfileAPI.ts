import BaseAPI from "../BaseAPI.js";

export interface CompleteProfilePayload {
  user_id: string;
  sex: boolean;
  dob: string; // YYYY-MM-DD
  contact_number: string;
  address_id?: string;
  password: string;
}

export interface CompleteProfileResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  user: {
    user_id: string;
    email: string;
    fname: string;
    lname: string;
    picture?: string;
    role: string;
    is_profile_complete: boolean;
  };
}

export const completeProfile = async (
  payload: CompleteProfilePayload
): Promise<CompleteProfileResponse> => {
  try {
    const response = await BaseAPI.post<CompleteProfileResponse>(
      "/auth/complete-profile",
      payload
    );
    return response.data;
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Failed to complete profile";
    throw new Error(message);
  }
};
