import BaseAPI from "../BaseAPI.js";

export interface CompleteProfilePayload {
  user_id: string;
  sex: boolean;
  dob: string; // YYYY-MM-DD
  contact_number: string;
  address_id?: string;
  password: string;
  role?: string; // Added role for distinction
}

export interface DoctorProfilePayload extends CompleteProfilePayload {
  front_prc?: File;
  back_prc?: File;
  selfie?: File;
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
  payload: FormData | CompleteProfilePayload | DoctorProfilePayload
): Promise<CompleteProfileResponse> => {
  try {
    let response;

    // 🩺 If doctor has files, use multipart/form-data
    if (
      (payload as DoctorProfilePayload).front_prc ||
      (payload as DoctorProfilePayload).back_prc ||
      (payload as DoctorProfilePayload).selfie
    ) {
      const formData = new FormData();
      formData.append("user_id", payload.user_id);
      formData.append("sex", String(payload.sex));
      formData.append("dob", payload.dob);
      formData.append("contact_number", payload.contact_number);
      formData.append("password", payload.password);
      if (payload.address_id) formData.append("address_id", payload.address_id);
      if (payload.role) formData.append("role", payload.role);

      const doctorPayload = payload as DoctorProfilePayload;
      if (doctorPayload.front_prc)
        formData.append("front_prc", doctorPayload.front_prc);
      if (doctorPayload.back_prc)
        formData.append("back_prc", doctorPayload.back_prc);
      if (doctorPayload.selfie)
        formData.append("selfie", doctorPayload.selfie);

      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    } 
    // 👤 Otherwise, use regular JSON
    else {
      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        payload
      );
    }

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
