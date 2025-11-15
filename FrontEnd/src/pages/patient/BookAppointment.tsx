import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/utils/api";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";

interface DoctorAvailability {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<any>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fix type issue: safely handle undefined doctor_id
  const doctorId = doctor_id ? parseInt(doctor_id, 10) : null;

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);
        setDoctor(doctorData);

        const availabilityRes = await api.get(`/schedules/${doctorId}`);
        setAvailabilities(availabilityRes.data || []);
      } catch (error) {
        console.error("Error loading doctor data:", error);
        toast.error("Failed to load doctor details");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  const handleConfirmBooking = async () => {
    if (!doctorId || selectedSlot === null) {
      toast.error("Please select a valid schedule slot");
      return;
    }

    try {
      setSubmitting(true);
      const slot = availabilities.find((a) => a.id === selectedSlot);
      if (!slot) {
        toast.error("Invalid time slot");
        return;
      }

      const payload = {
        doctor_id: doctorId,
        appointment_date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason,
      };

      const res = await api.post("/appointments", payload);

      if (res.status === 201 || res.status === 200) {
        toast.success("Appointment booked successfully");
        navigate("/patient/appointments");
      }
    } catch (err: any) {
      console.error("Booking failed:", err?.response?.data || err);
      toast.error(err?.response?.data?.detail || "Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-center mt-10 text-gray-600">Loading doctor data...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar role="patient" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Book Appointment with {doctor?.name || "Doctor"}
        </h1>
        <p className="text-gray-600 mb-6">
          Specialization: {doctor?.specialization || "General Practice"}
        </p>

        {/* Available slots */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-medium text-gray-700">Available Schedules</h2>
          {availabilities.length === 0 ? (
            <p className="text-gray-500">No available schedules found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availabilities.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`p-4 rounded-xl border ${
                    selectedSlot === slot.id
                      ? "border-blue-500 bg-blue-100"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  } transition`}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {new Date(slot.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {slot.start_time} - {slot.end_time}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason for visit */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Visit
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe your concern..."
            className="w-full p-3 border border-gray-300 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          disabled={!selectedSlot || submitting}
          onClick={handleConfirmBooking}
          className={`w-full py-3 rounded-xl text-white font-medium ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } transition`}
        >
          {submitting ? "Booking..." : "Confirm Appointment"}
        </button>
      </main>
    </div>
  );
};

export default BookAppointment;
