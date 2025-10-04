// src/services/patient/GetDoctorAPI.js
import BaseAPI from "../BaseAPI";

const GetDoctorAPI = {
  getDoctors: async () => {
    try {
      const response = await BaseAPI.get("/doctors/");
      return response.data;
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  },
};

export default GetDoctorAPI;
