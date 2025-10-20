import BaseAPI from "../BaseAPI";

export interface CompleteProfilePayload {
  user_id: string;
  role: string;
  sex: string;
  dob: string;
  contact_number: string;
  province: string;
  city: string;
  barangay: string;
  password: string;
  license_number?: string;
  years_of_experience?: string;
  specializations?: string;
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
    address: string;
  };
}

export const completeProfile = async (
  payload: FormData | CompleteProfilePayload | DoctorProfilePayload
): Promise<CompleteProfileResponse> => {
  try {
    let response;

    if (payload instanceof FormData) {
      console.log("📤 Sending FormData directly");
      console.log("FormData contents:", Array.from(payload.entries()));
      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    } 
    // Doctor with files
    else if (
      (payload as DoctorProfilePayload).prc_license_front ||
      (payload as DoctorProfilePayload).prc_license_back ||
      (payload as DoctorProfilePayload).prc_license_selfie
    ) {
      console.log("📤 Building FormData for Doctor with files");
      const formData = new FormData();

      // Required fields
      formData.append("user_id", String(payload.user_id));
      formData.append("role", payload.role);
      formData.append("sex", payload.sex);
      formData.append("dob", payload.dob);
      formData.append("contact_number", payload.contact_number);
      formData.append("province", payload.province);
      formData.append("city", payload.city);
      formData.append("barangay", payload.barangay);
      formData.append("password", payload.password);

      // Optional doctor fields
      const doctorPayload = payload as DoctorProfilePayload;
      if (doctorPayload.license_number)
        formData.append("license_number", doctorPayload.license_number);
      if (doctorPayload.years_of_experience)
        formData.append("years_of_experience", String(doctorPayload.years_of_experience));
      if (doctorPayload.specializations)
        formData.append("specializations", doctorPayload.specializations);

      // Files
      if (doctorPayload.prc_license_front)
        formData.append("prc_license_front", doctorPayload.prc_license_front);
      if (doctorPayload.prc_license_back)
        formData.append("prc_license_back", doctorPayload.prc_license_back);
      if (doctorPayload.prc_license_selfie)
        formData.append("prc_license_selfie", doctorPayload.prc_license_selfie);

      console.log("📤 FormData entries:", Array.from(formData.entries()).map(([key, val]) => [
        key,
        val instanceof File ? `[File: ${val.name}]` : val
      ]));

      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    } 
    // Patient (JSON body)
    else {
      console.log("📤 Sending Patient data as JSON");
      console.log("Payload:", payload);
      response = await BaseAPI.post<CompleteProfileResponse>(
        "/auth/complete-profile",
        payload
      );
    }

    console.log("✅ Success:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error:", error);
    console.error("Response status:", error.response?.status);
    console.error("Full response data:", JSON.stringify(error.response?.data, null, 2));
    
    // Parse validation errors from FastAPI
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        console.error("❌ Validation errors:");
        detail.forEach((err: any) => {
          console.error(`  Field: ${JSON.stringify(err.loc)}`);
          console.error(`  Message: ${err.msg}`);
          console.error(`  Type: ${err.type}`);
          console.error("---");
        });
      } else {
        console.error("❌ Error detail:", detail);
      }
    }

    let message = "Failed to complete profile";
    if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        message = error.response.data.detail
          .map((err: any) => `${err.loc[err.loc.length - 1]}: ${err.msg}`)
          .join("; ");
      } else {
        message = JSON.stringify(error.response.data.detail);
      }
    }
    
    throw new Error(message);
  }
};