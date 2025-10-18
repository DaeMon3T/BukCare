import BaseAPI from "../BaseAPI";

export interface CompleteProfilePayload {
  user_id: string;
  role: string; // "patient" or "doctor"
  sex: string; // "0" or "1"
  dob: string; // YYYY-MM-DD
  contact_number: string;
  province_id: string;
  city_id: string;
  barangay: string;
  password: string;
  confirmPassword: string;
  license_number?: string;
  years_of_experience?: string;
  specializations?: string; // JSON string array
}

export interface DoctorProfilePayload extends CompleteProfilePayload {
  prc_license_front?: File;
  prc_license_back?: File;
  prc_license_selfie?: File;
}

export interface CompleteProfileResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };
  user: {
    user_id: string;
    email: string;
    fname: string;
    lname: string;
    name: string;
    picture?: string;
    role: string;
    is_verified: boolean;
    is_profile_complete: boolean;
  };
}

export const completeProfile = async (
  payload: FormData | CompleteProfilePayload | DoctorProfilePayload
): Promise<CompleteProfileResponse> => {
  try {
    let response;

    // If payload is already FormData, use it directly
    if (payload instanceof FormData) {
      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    }
    // If it's a doctor with files, convert to FormData
    else if (
      (payload as DoctorProfilePayload).prc_license_front ||
      (payload as DoctorProfilePayload).prc_license_back ||
      (payload as DoctorProfilePayload).prc_license_selfie
    ) {
      const formData = new FormData();
      
      // Add all text fields
      formData.append("user_id", payload.user_id);
      formData.append("role", payload.role);
      formData.append("sex", payload.sex);
      formData.append("dob", payload.dob);
      formData.append("contact_number", payload.contact_number);
      formData.append("province_id", payload.province_id);
      formData.append("city_id", payload.city_id);
      formData.append("barangay", payload.barangay);
      formData.append("password", payload.password);
      formData.append("confirmPassword", payload.confirmPassword);

      // Add optional doctor fields
      const doctorPayload = payload as DoctorProfilePayload;
      if (doctorPayload.license_number)
        formData.append("license_number", doctorPayload.license_number);
      if (doctorPayload.years_of_experience)
        formData.append("years_of_experience", doctorPayload.years_of_experience);
      if (doctorPayload.specializations)
        formData.append("specializations", doctorPayload.specializations);

      // Add file fields
      if (doctorPayload.prc_license_front)
        formData.append("prc_license_front", doctorPayload.prc_license_front);
      if (doctorPayload.prc_license_back)
        formData.append("prc_license_back", doctorPayload.prc_license_back);
      if (doctorPayload.prc_license_selfie)
        formData.append("prc_license_selfie", doctorPayload.prc_license_selfie);

      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
    }
    // Otherwise, use regular JSON for patient
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