import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/services/api";
import GetDoctorAPI, { type DoctorAvailability, type Doctor } from "@/services/patient/GetDoctorAPI";
import AppointmentAvailabilityAPI from "@/services/patient/AppointmentAvailabilityAPI";
import { Calendar, Clock, CheckCircle } from "lucide-react";

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

  const getLocalTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };   

  // 1. Initial Load
  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);
        
        const todayStr = getLocalTodayStr(); 
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const validAvailabilities = (doctorData.availabilities || []).filter((slot) => {
            if (!slot.date || !slot.start_time) return false;

            // ✅ FIX APPLIED HERE: Added '?? ""' to handle possible undefined
            const slotDate = slot.date.split("T")[0] ?? "";

            // 1. If date is in the past -> REMOVE
            if (slotDate < todayStr) return false;

            // 2. If date is in the future -> KEEP
            if (slotDate > todayStr) return true;

            // 3. If date is TODAY, check the time -> FILTER
            if (slotDate === todayStr) {
                const parts = slot.start_time.split(":").map(Number);
                const h = parts[0] ?? 0;
                const m = parts[1] ?? 0;

                // Simple time check
                if (h > currentHour) return true;
                if (h === currentHour && m > currentMinute) return true;
                return false;
            }

            return true;
        });

        setDoctor(doctorData);
        setAvailabilities(validAvailabilities);
        
        if (validAvailabilities.length > 0) {
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

  // 2. Fetch Slots for "Custom" Mode
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
        
        const todayStr = getLocalTodayStr();
        const isToday = selectedDate === todayStr;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        const validSlots = response.available_slots.filter((timeStr: string) => {
            if (!isToday) return true; 
            
            let timePart = timeStr;
            if (timeStr.includes("T")) {
                timePart = timeStr.split("T")[1] ?? timeStr; 
            }
            
            const timeComponents = timePart.split(":").map(Number);
            const h = timeComponents[0] ?? 0;
            const m = timeComponents[1] ?? 0;
            
            if (h > currentHour) return true;
            if (h === currentHour && m > currentMinute) return true;
            return false;
        });
        
        setAvailableTimeSlots(validSlots);
        
        if (validSlots.length === 0) {
          toast.error("No valid slots available for this date");
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
    const date = new Date(isoString.includes("T") ? isoString : `2000-01-01T${isoString}`);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMinDate = () => {
    return getLocalTodayStr(); // Reusing the helper here ensures consistency
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const year = maxDate.getFullYear();
    const month = String(maxDate.getMonth() + 1).padStart(2, '0');
    const day = String(maxDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      // Ensure we treat the date string safely
      const safeDate = (slot.date.split('T')[0] ?? "");
      appointmentDateTime = `${safeDate}T${slot.start_time}`;
    } else {
      if (!selectedCustomSlot) {
        toast.error("Please select a time slot");
        return;
      }
      appointmentDateTime = selectedCustomSlot.includes("T") 
        ? selectedCustomSlot 
        : `${selectedDate}T${selectedCustomSlot}`;
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
        toast.error("This time slot is no longer available.");
        if (bookingMode === "custom" && selectedDate) {
             // Logic to re-trigger fetch could go here if needed
             // forcing a refresh by clearing slots temporarily
             setAvailableTimeSlots([]); 
        }
      } else {
        toast.error(err?.response?.data?.detail || "Failed to create appointment");
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

  const avatarSrc = doctor?.avatar && doctor.avatar.trim() !== "" ? doctor.avatar : "/default-avatar.png";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-center text-red-500 font-medium">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar/>

      <main className="max-w-3xl mx-auto px-4 py-8">
        
        {/* DOCTOR HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <div className="px-6 pb-6 relative">
            <div className="-mt-12 mb-4">
                <img
                  src={avatarSrc}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }}
                />
            </div>
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dr. {doctor.name}</h1>
                    <p className="text-slate-500 font-medium">{doctor.specialization || "General Practice"}</p>
                </div>
                {availabilities.length > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Available
                    </span>
                )}
            </div>
          </div>
        </div>

        {/* BOOKING FORM */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Select Date & Time</h2>

            {/* Mode Switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setBookingMode("availability")}
                    disabled={availabilities.length === 0}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        bookingMode === "availability" 
                            ? "bg-white text-slate-900 shadow-sm" 
                            : availabilities.length === 0 
                                ? "text-slate-400 cursor-not-allowed" 
                                : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Doctor's Schedule
                </button>
                <button
                    onClick={() => setBookingMode("custom")}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        bookingMode === "custom" 
                            ? "bg-white text-slate-900 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                    Custom Date
                </button>
            </div>

            {/* Availability Mode */}
            {bookingMode === "availability" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {availabilities.map((slot) => {
                        const dateObj = new Date(slot.date);
                        return (
                            <button
                                key={slot.id}
                                onClick={() => setSelectedAvailabilitySlot(slot.id)}
                                className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                                    selectedAvailabilitySlot === slot.id
                                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                                        : "border-slate-100 hover:border-blue-300"
                                }`}
                            >
                                <p className="text-xs font-bold text-slate-400 uppercase">
                                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <p className="text-lg font-bold text-slate-900">
                                    {dateObj.getDate()} {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                                </p>
                                <p className="text-sm font-medium text-blue-600 mt-1">
                                    {slot.start_time.slice(0,5)}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Custom Mode */}
            {bookingMode === "custom" && (
                <div className="space-y-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Pick a Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={getMinDate()}
                            max={getMaxDate()}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {selectedDate && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Available Slots
                            </label>
                            {loadingSlots ? (
                                <div className="py-8 text-center text-slate-400 text-sm">Checking availability...</div>
                            ) : availableTimeSlots.length === 0 ? (
                                <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-xl border border-amber-100">
                                    No slots available for this date.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {availableTimeSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedCustomSlot(slot)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                                selectedCustomSlot === slot
                                                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-400"
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

            {/* Reason */}
            <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Visit (Optional)</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe your symptoms..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Submit Button */}
            <button
                disabled={!isFormValid() || submitting}
                onClick={handleConfirmBooking}
                className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-[0.98] ${
                    !isFormValid() || submitting
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30"
                }`}
            >
                {submitting ? "Booking..." : "Confirm Appointment"}
            </button>
        </div>

      </main>
    </div>
  );
};

export default BookAppointment;