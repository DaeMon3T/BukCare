import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/services/api";
import GetDoctorAPI, { type DoctorAvailability, type Doctor } from "@/services/patient/GetDoctorAPI";
import AppointmentAvailabilityAPI from "@/services/patient/AppointmentAvailabilityAPI";

type BookingMode = "availability" | "custom";

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  
  const [bookingMode, setBookingMode] = useState<BookingMode>("availability");
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedCustomSlot, setSelectedCustomSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
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

  const formatTimeSlot = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

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

      appointmentDateTime = `${slot.date.split('T')[0]}T${slot.start_time}`;
    } else {
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

      await api.post("/appointments/", payload);

      toast.success("Appointment booked successfully! 🎉");
      navigate("/patient/appointments");
    } catch (err: any) {
      console.error("❌ Booking failed:", err?.response?.data || err);
      
      if (err?.response?.status === 409) {
        toast.error("This time slot is no longer available. Please choose another.");
        
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

  // Fallback avatar
  const avatarSrc = doctor?.avatar && doctor.avatar.trim() !== "" ? doctor.avatar : "/default-avatar.png";

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
      <Navbar/>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Enhanced Doctor Profile Card with Image */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h1 className="text-white text-xl font-semibold">Book an Appointment</h1>
          </div>
          
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Doctor Avatar with Image */}
              <div className="flex-shrink-0">
                <img
                  src={avatarSrc}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>

              {/* Doctor Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Dr. {doctor.name}
                  
                  {availabilities.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Available for appointments
                  </div>
                )}

                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{doctor.specialization}</span>
                    </span>
                  </div>
                  
                  {doctor.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700 text-sm">{doctor.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.213L8.25 11.25M15 11l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{doctor.years_of_experience}</span> years of experience
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{doctor.specialization}</span>
                    </span>
                  </div>
                </div>

                
              </div>
            </div>
          </div>
        </div>

        {/* Compact Booking Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          {/* Tab-style Booking Mode Selector */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setBookingMode("availability");
                setSelectedCustomSlot(null);
                setSelectedDate("");
              }}
              disabled={availabilities.length === 0}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                bookingMode === "availability"
                  ? "bg-white text-blue-600 shadow-sm"
                  : availabilities.length === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Doctor's Schedule
            </button>
            <button
              onClick={() => {
                setBookingMode("custom");
                setSelectedAvailabilitySlot(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-sm transition-all ${
                bookingMode === "custom"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Custom Date & Time
            </button>
          </div>

          {/* Availability Mode */}
          {bookingMode === "availability" && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Select an available time slot
              </h3>
              {availabilities.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                  No scheduled slots available. Try custom booking instead.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availabilities.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedAvailabilitySlot(slot.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedAvailabilitySlot === slot.id
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {slot.date ? new Date(slot.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : "Recurring"}
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

          {/* Custom Mode */}
          {bookingMode === "custom" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Choose a date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Available time slots
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 text-sm mt-2">Loading slots...</p>
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                      No slots available for this date. Try another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedCustomSlot(slot)}
                          className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedCustomSlot === slot
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {formatTimeSlot(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reason Section - More Compact */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Reason for visit <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Briefly describe your concern..."
            className="w-full p-3 border border-gray-300 rounded-lg h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Confirm Button */}
        <button
          disabled={!isFormValid() || submitting}
          onClick={handleConfirmBooking}
          className={`w-full py-4 rounded-xl text-white font-semibold text-lg transition-all ${
            submitting || !isFormValid()
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
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