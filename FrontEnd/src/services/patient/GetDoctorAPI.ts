// src/services/patient/GetDoctorAPI.ts
import BaseAPI from "../BaseAPI.ts";

export interface Doctor {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialization: string;
  license_number: string;
  hospital_affiliation?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  years_of_experience?: number;
  education?: string[];
  certifications?: string[];
  profile_picture?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const GetDoctorAPI = {
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      const response = await BaseAPI.get<Doctor[]>("/doctors/");
      return response.data;
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  },
};

export default GetDoctorAPI;