import BaseAPI from "../BaseAPI";

// ------------------------------
// Availability Interface
// ------------------------------
export interface DoctorAvailability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// ------------------------------
// Doctor Interface (matches backend)
// ------------------------------
export interface Doctor {
  doctor_id: number;
  user_id?: number;           // backend returns this
  name: string;
  email: string;
  specialization?: string;    // summary field
  license_number?: string;
  years_of_experience?: number;
  address?: string;
  avatar?: string;            // ← added

  is_verified: boolean;
  is_doctor_approved: boolean;

  created_at: string;
  updated_at: string;

  availabilities: DoctorAvailability[];
}

const GetDoctorAPI = {
  // Fetch all doctors
  getDoctors: async (): Promise<Doctor[]> => {
    try {
      const response = await BaseAPI.get<Doctor[]>("/doctors/");
      return response.data;
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  },

  // Fetch a single doctor by ID
  getDoctorById: async (doctorId: number): Promise<Doctor> => {
    try {
      const response = await BaseAPI.get<Doctor>(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching doctor with ID ${doctorId}:`, error);
      throw error;
    }
  },
};

export default GetDoctorAPI;
