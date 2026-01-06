import api from "./api";

export interface Review {
  id: number;
  doctor_id: number;
  patient_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export default {
  getDoctorReviews: async (doctorId: number) => {
    const res = await api.get(`/reviews/${doctorId}`);
    return res.data;
  },
  
  createReview: async (data: { doctor_id: number; rating: number; comment: string }) => {
    const res = await api.post("/reviews/", data);
    return res.data;
  }
};