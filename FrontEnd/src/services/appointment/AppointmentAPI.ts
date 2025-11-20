// src/services/appointment/AppointmentAPI.ts
import BaseAPI from "../BaseAPI";

export interface DoctorAvailability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface AppointmentPayload {
  doctor_id: number;
  appointment_date: string;
  reason?: string | null;
}

const AppointmentAPI = {
  createAppointment: async (payload: AppointmentPayload) => {
    const response = await BaseAPI.post("/appointments/", payload);
    return response.data;
  },

  getAvailableSlots: async (doctorId: number, date: string) => {
    const response = await BaseAPI.get(`/appointments/availability/${doctorId}?date=${date}`);
    return response.data;
  },
};

export default AppointmentAPI;
