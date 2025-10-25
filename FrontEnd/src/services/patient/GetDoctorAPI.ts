// src/services/patient/GetDoctorAPI.ts
import BaseAPI from "../BaseAPI";

export interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  specialization: string;
  license_number: string;
  years_of_experience: number;
  address: string;
  is_verified: boolean;
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
