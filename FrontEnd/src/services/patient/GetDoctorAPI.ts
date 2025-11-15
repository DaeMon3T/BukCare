// src/services/patient/GetDoctorAPI.ts
import BaseAPI from "../BaseAPI";

export interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  specialization: string;
  license_number?: string;
  years_of_experience?: number;
  address?: string;
  is_verified?: boolean;
  is_doctor_approved?: boolean;
  created_at: string;
  updated_at: string;
}

const GetDoctorAPI = {
  // ✅ Fetch all doctors
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      const response = await BaseAPI.get<Doctor[]>("/doctors/");
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching doctors:", error);
      throw error;
    }
  },

  // ✅ Fetch a single doctor by ID
  getDoctorById: async (doctorId: number): Promise<Doctor> => {
    try {
      const response = await BaseAPI.get<Doctor>(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching doctor with ID ${doctorId}:`, error);
      throw error;
    }
  },
};

export default GetDoctorAPI;
