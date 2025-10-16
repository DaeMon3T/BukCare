// ============================================================================
// DoctorSignUpAPI.ts - Doctor Registration API Service
// ============================================================================

import BaseAPI from "../BaseAPI.js";

// -----------------------------
// Type Definitions
// -----------------------------

export interface InvitationData {
  email: string;
  role: string;
  [key: string]: any;
}

export interface DoctorRegistrationData {
  invite_token: string;
  fname: string;
  lname: string;
  mname?: string | null;
  email: string;
  phone: string;
  licenseNumber: string;
  password: string;
  specialization: string[];
  otherSpecialization?: string | null;
}

export interface DoctorRegistrationResponse {
  message?: string;
  detail?: string;
  user_id?: number;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  detail?: string;
  [key: string]: any;
}

// -----------------------------
// Validate Invitation Token
// -----------------------------
export const validateInvitation = async (
  token: string
): Promise<InvitationData> => {
  try {
    const response = await BaseAPI.get<ApiResponse<InvitationData>>(
      `/auth/validate-invite/${token}`
    );

    // Verify it's a doctor invitation
    if (response.data.data?.role !== "doctor") {
      throw new Error("This invitation is not for a doctor account");
    }

    return response.data.data;
  } catch (error: any) {
    console.error("Invitation validation error:", error);
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Invalid or expired invitation";
    throw new Error(message);
  }
};

// -----------------------------
// Register Doctor Account
// -----------------------------
export const registerDoctor = async (
  doctorData: DoctorRegistrationData
): Promise<DoctorRegistrationResponse> => {
  try {
    const response = await BaseAPI.post<DoctorRegistrationResponse>(
      "/auth/doctor-signup", 
      doctorData
    );

    return response.data;
  } catch (error: any) {
    console.error("Doctor registration error:", error);
    
    // Enhanced error extraction
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      "Doctor registration failed";
      
    throw new Error(message);
  }
};