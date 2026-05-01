// src/services/staff/StaffAccessAPI.ts
import BaseAPI from "../BaseAPI";

export interface StaffAccessRecord {
  id: number;
  doctor_id: number;
  staff_user_id: number;
  staff_name: string;
  staff_email: string;
  staff_picture?: string | null;
  can_view_appointments: boolean;
  can_manage_appointments: boolean;
  can_book_walkins: boolean;
  can_register_patients: boolean;
  granted_at?: string | null;
}

export interface DoctorAccessRecord {
  id: number;
  doctor_id: number;
  doctor_name: string;
  doctor_email: string;
  doctor_picture?: string | null;
  can_view_appointments: boolean;
  can_manage_appointments: boolean;
  can_book_walkins: boolean;
  can_register_patients: boolean;
  granted_at?: string | null;
}

export interface AvailableStaff {
  id: number;
  name: string;
  email: string;
  picture?: string | null;
  already_granted: boolean;
}

export interface GrantAccessPayload {
  staff_user_id: number;
  can_view_appointments?: boolean;
  can_manage_appointments?: boolean;
  can_book_walkins?: boolean;
  can_register_patients?: boolean;
}

export interface UpdateAccessPayload {
  can_view_appointments?: boolean;
  can_manage_appointments?: boolean;
  can_book_walkins?: boolean;
  can_register_patients?: boolean;
}

const StaffAccessAPI = {
  // Doctor endpoints
  getMyStaff: async (): Promise<StaffAccessRecord[]> => {
    const response = await BaseAPI.get("/staff-access/my-staff");
    return response.data;
  },

  getAvailableStaff: async (): Promise<AvailableStaff[]> => {
    const response = await BaseAPI.get("/staff-access/available-staff");
    return response.data;
  },

  grantAccess: async (payload: GrantAccessPayload): Promise<StaffAccessRecord> => {
    const response = await BaseAPI.post("/staff-access/grant", payload);
    return response.data;
  },

  updateAccess: async (accessId: number, payload: UpdateAccessPayload): Promise<StaffAccessRecord> => {
    const response = await BaseAPI.put(`/staff-access/${accessId}`, payload);
    return response.data;
  },

  revokeAccess: async (accessId: number): Promise<void> => {
    await BaseAPI.delete(`/staff-access/${accessId}`);
  },

  // Staff endpoints
  getMyDoctors: async (): Promise<DoctorAccessRecord[]> => {
    const response = await BaseAPI.get("/staff-access/my-doctors");
    return response.data;
  },
};

export default StaffAccessAPI;
