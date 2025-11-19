import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/utils/api";
import GetDoctorAPI, { type DoctorAvailability, type Doctor } from "@/services/patient/GetDoctorAPI";
import AppointmentAvailabilityAPI from "@/services/patient/AppointmentAvailabilityAPI";

type BookingMode = "availability" | "custom";

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  
  // Booking mode selection
  const [bookingMode, setBookingMode] = useState<BookingMode>("availability");
  
  // For availability mode
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<number | null>(null);
  
  // For custom mode
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedCustomSlot, setSelectedCustomSlot] = useState<string | null>(null);
  
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const doctorId = doctor_id ? parseInt(doctor_id, 10) : null;

  // Fetch doctor data
  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);
        setDoctor(doctorData);
        setAvailabilities(doctorData.availabilities || []);
        
        // If doctor has availabilities, default to availability mode
        if (doctorData.availabilities && doctorData.availabilities.length > 0) {
          setBookingMode("availability");
        } else {
          setBookingMode("custom");
        }
      } catch (error) {
        console.error("Error loading doctor data:", error);
        toast.error("Failed to load doctor details");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  // Fetch available time slots when date is selected (custom mode)
  useEffect(() => {
    if (bookingMode !== "custom" || !doctorId || !selectedDate) return;

    const fetchAvailableSlots = async () => {
      try {
        setLoadingSlots(true);
        setSelectedCustomSlot(null);
        
        const response = await AppointmentAvailabilityAPI.getAvailableSlots(
          doctorId,
          selectedDate
        );
        
        setAvailableTimeSlots(response.available_slots);
        
        if (response.available_slots.length === 0) {
          toast.error("No available slots for this date");
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Failed to load available time slots");
        setAvailableTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [doctorId, selectedDate, bookingMode]);

  // Format time slot for display
  const formatTimeSlot = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split("T")[0];
  };

  const handleConfirmBooking = async () => {
    if (!doctorId) {
      toast.error("Doctor information missing");
      return;
    }

    let appointmentDateTime: string;

    // Validate based on booking mode
    if (bookingMode === "availability") {
      if (selectedAvailabilitySlot === null) {
        toast.error("Please select a schedule slot");
        return;
      }

      const slot = availabilities.find((a) => a.id === selectedAvailabilitySlot);
      if (!slot) {
        toast.error("Invalid time slot");
        return;
      }

      // Combine date and start_time into a single datetime
      appointmentDateTime = `${slot.date.split('T')[0]}T${slot.start_time}`;
    } else {
      // Custom mode
      if (!selectedCustomSlot) {
        toast.error("Please select a time slot");
        return;
      }
      appointmentDateTime = selectedCustomSlot;
    }

    try {
      setSubmitting(true);

      const payload = {
        doctor_id: doctorId,
        appointment_date: appointmentDateTime,
        reason: reason || null,
      };

      console.log("📤 Sending payload:", payload);

      await api.post("/appointments/", payload);

      toast.success("Appointment booked successfully! 🎉");
      navigate("/patient/appointments");
    } catch (err: any) {
      console.error("❌ Booking failed:", err?.response?.data || err);
      
      if (err?.response?.status === 409) {
        toast.error("This time slot is no longer available. Please choose another.");
        
        // Refresh available slots if in custom mode
        if (bookingMode === "custom" && selectedDate) {
          const response = await AppointmentAvailabilityAPI.getAvailableSlots(
            doctorId,
            selectedDate
          );
          setAvailableTimeSlots(response.available_slots);
          setSelectedCustomSlot(null);
        }
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            "Failed to create appointment"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (bookingMode === "availability") {
      return selectedAvailabilitySlot !== null;
    } else {
      return selectedCustomSlot !== null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading doctor data...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <p className="text-center text-red-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar role="patient" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Doctor Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Book Appointment with Dr. {doctor.name}
          </h1>
          <p className="text-gray-600">
            Specialization: <span className="font-medium">{doctor.specialization}</span>
          </p>
        </div>

        {/* Booking Mode Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            Choose Booking Method
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setBookingMode("availability");
                setSelectedCustomSlot(null);
                setSelectedDate("");
              }}
              disabled={availabilities.length === 0}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookingMode === "availability"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : availabilities.length === 0
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${
                  bookingMode === "availability" 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-gray-300"
                }`}>
                  {bookingMode === "availability" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Doctor's Available Schedules
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose from doctor's pre-set availability slots
                  </p>
                  {availabilities.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">No schedules available</p>
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setBookingMode("custom");
                setSelectedAvailabilitySlot(null);
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                bookingMode === "custom"
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${
                  bookingMode === "custom" 
                    ? "border-blue-500 bg-blue-500" 
                    : "border-gray-300"
                }`}>
                  {bookingMode === "custom" && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Custom Date & Time
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose any available date and time slot
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Availability Mode: Doctor's Schedules */}
        {bookingMode === "availability" && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4">
              Available Schedules
            </h2>
            {availabilities.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800">No available schedules found for this doctor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availabilities.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedAvailabilitySlot(slot.id)}
                    className={`p-4 rounded-xl border-2 ${
                      selectedAvailabilitySlot === slot.id
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
        )}

        {/* Custom Mode: Date & Time Selection */}
        {bookingMode === "custom" && (
          <>
            {/* Date Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">
                Select Date
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                You can book appointments up to 3 months in advance
              </p>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">
                  Available Time Slots
                </h2>

                {loadingSlots ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading available slots...</p>
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800">
                      No available slots for this date. Please choose another date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableTimeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedCustomSlot(slot)}
                        className={`p-3 rounded-lg border-2 font-medium transition-all ${
                          selectedCustomSlot === slot
                            ? "border-blue-500 bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                      >
                        {formatTimeSlot(slot)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Reason for Visit */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Reason for Visit <span className="text-gray-400 text-sm">(Optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe your concern or symptoms..."
            className="w-full p-3 border border-gray-300 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Confirm Button */}
        <button
          disabled={!isFormValid() || submitting}
          onClick={handleConfirmBooking}
          className={`w-full py-3 rounded-xl text-white font-medium transition-colors ${
            submitting || !isFormValid()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Booking...
            </span>
          ) : (
            "Confirm Appointment"
          )}
        </button>
      </main>
    </div>
  );
};

export default BookAppointment;