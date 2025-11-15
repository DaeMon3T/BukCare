import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/utils/api";
// This is the corrected line:
import GetDoctorAPI, { type DoctorAvailability, type Doctor } from "@/services/patient/GetDoctorAPI";

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const doctorId = doctor_id ? parseInt(doctor_id, 10) : null;

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);

        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);

        setDoctor(doctorData);
        setAvailabilities(doctorData.availabilities || []);

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
      toast.error("Please select a schedule slot");
      return;
    }

    const slot = availabilities.find((a) => a.id === selectedSlot);
    if (!slot) {
      toast.error("Invalid time slot");
      return;
    }

    try {
      setSubmitting(true);

      // Log the raw slot data
      console.log("🔍 Selected slot:", slot);
      console.log("📅 Slot date:", slot.date);
      console.log("🕐 Slot start_time:", slot.start_time);
      console.log("🕐 Slot end_time:", slot.end_time);

      // Combine date and start_time into a single datetime
      const appointmentDateTime = `${slot.date.split('T')[0]}T${slot.start_time}`;
      
      console.log("🔧 Combined datetime:", appointmentDateTime);

      const payload = {
        doctor_id: doctorId,
        appointment_date: appointmentDateTime,
        reason: reason || null,
      };

      console.log("📤 Sending payload:", payload);
      console.log("📤 Payload JSON:", JSON.stringify(payload, null, 2));

      const res = await api.post("/appointments", payload);

      toast.success("Appointment booked successfully");
      navigate("/patient/appointments");

    } catch (err: any) {
      console.error("❌ Booking failed:", err?.response?.data || err);
      console.error("❌ Full error:", err);
      
      // Show detailed validation errors if available
      if (err?.response?.data?.details) {
        console.error("❌ Validation details:", err.response.data.details);
      } 
      // Show detailed validation errors if available
      if (err?.response?.data?.details) {
        console.error("❌ Validation details:", JSON.stringify(err.response.data.details, null, 2));
      }
      
      toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to create appointment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-center text-gray-600">
          Loading doctor data...
        </p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-center text-red-600">
          Doctor not found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar role="patient" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Book Appointment with {doctor.name}
        </h1>

        <p className="text-gray-600 mb-6">
          Specialization: {doctor.specialization}
        </p>

        {/* Schedules */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-medium text-gray-700">Available Schedules</h2>

          {availabilities.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800">No available schedules found for this doctor.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availabilities.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`p-4 rounded-xl border ${
                    selectedSlot === slot.id
                      ? "border-blue-500 bg-blue-100 ring-2 ring-blue-300"
                      : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                  } transition-all duration-200`}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {slot.date ? new Date(slot.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : "Recurring Schedule"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {slot.start_time} - {slot.end_time}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Visit <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe your concern or symptoms..."
            className="w-full p-3 border border-gray-300 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          disabled={!selectedSlot || submitting}
          onClick={handleConfirmBooking}
          className={`w-full py-3 rounded-xl text-white font-medium ${
            submitting || !selectedSlot
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          } transition-colors duration-200`}
        >
          {submitting ? "Booking..." : "Confirm Appointment"}
        </button>
      </main>
    </div>
  );
};

export default BookAppointment;