// src/services/patient/AppointmentAvailabilityAPI.ts
import BaseAPI from "../BaseAPI";

export interface AvailableSlot {
  datetime: string;
  time: string;
  is_available: boolean;
}

export interface AvailableSlotsResponse {
  doctor_id: number;
  date: string;
  available_slots: string[];
  total_slots: number;
}

export interface CheckAvailabilityResponse {
  doctor_id: number;
  appointment_date: string;
  is_available: boolean;
  message: string;
}

const AppointmentAvailabilityAPI = {
  // Get all available slots for a doctor on a specific date
  getAvailableSlots: async (
    doctorId: number,
    date: string // Format: YYYY-MM-DD
  ): Promise<AvailableSlotsResponse> => {
    try {
      const response = await BaseAPI.get<AvailableSlotsResponse>(
        `/appointments/available-slots/${doctorId}?date=${date}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching available slots:", error);
      throw error;
    }
  },

  // Check if a specific time is available
  checkTimeAvailability: async (
    doctorId: number,
    appointmentDate: string // Format: ISO datetime string
  ): Promise<CheckAvailabilityResponse> => {
    try {
      const response = await BaseAPI.get<CheckAvailabilityResponse>(
        `/appointments/check-availability/${doctorId}?appointment_date=${appointmentDate}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  },
};

export default AppointmentAvailabilityAPI;