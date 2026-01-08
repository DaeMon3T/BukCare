import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import api from "@/services/api";
import GetDoctorAPI, { type DoctorAvailability, type Doctor } from "@/services/patient/GetDoctorAPI";
import AppointmentAvailabilityAPI from "@/services/patient/AppointmentAvailabilityAPI";
import { 
    Check, 
    ArrowLeft, 
    MapPin, 
    Stethoscope, 
    Info,
    ChevronRight,
    CalendarDays,
    Sun,
    Moon
} from "lucide-react";

type BookingMode = "availability" | "custom";

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  
  const [bookingMode, setBookingMode] = useState<BookingMode>("availability");
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<number | null>(null);
  
  // Track selected date tab
  const [activeDateTab, setActiveDateTab] = useState<string>("");

  // Store "real" booked slots to filter them out of suggestions
  const [bookedSlotsForActiveTab, setBookedSlotsForActiveTab] = useState<string[]>([]);

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

  // 1. Initial Load & Sorting
  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);
        const todayStr = getLocalTodayStr(); 

        // === FILTER: REMOVE PAST DATES ===
        let validAvailabilities = (doctorData.availabilities || []).filter((slot) => {
            if (!slot.date || !slot.start_time) return false;
            const slotDate = slot.date.split("T")[0] ?? "";
            
            // 1. If date is in the past, hide it entirely
            if (slotDate < todayStr) return false; 
            
            return true;
        });

        // SORTING
        validAvailabilities.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.start_time.localeCompare(b.start_time);
        });

        setDoctor(doctorData);
        setAvailabilities(validAvailabilities);
        
        // AUTO-SELECT FIRST DATE
        if (validAvailabilities.length > 0) {
            const firstSlot = validAvailabilities[0];
            if (firstSlot?.date) {
                const firstDate = firstSlot.date.split('T')[0] || ""; 
                if (firstDate) {
                    setActiveDateTab(firstDate);
                    setBookingMode("availability");
                }
            }
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

  // 2. NEW: Fetch Real Availability for Suggested Tabs
  // This ensures that even "Suggested" slots respect real bookings
  useEffect(() => {
    if (!doctorId || !activeDateTab || bookingMode !== "availability") return;

    const verifyTabAvailability = async () => {
        try {
            // We ask the backend: "What is REALLY available on this date?"
            // The backend checks the 'appointments' table and excludes booked times.
            const response = await AppointmentAvailabilityAPI.getAvailableSlots(
                doctorId,
                activeDateTab
            );
            // Store the list of TRULY available times (e.g., ["09:00:00", "10:00:00"])
            setBookedSlotsForActiveTab(response.available_slots || []); 
        } catch (error) {
            console.error("Failed to verify tab slots", error);
        }
    };
    verifyTabAvailability();
  }, [doctorId, activeDateTab, bookingMode]);


  // 3. Fetch Slots for "Custom" Mode
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

        // === FILTER: PAST TIME CHECK ===
        const validSlots = response.available_slots.filter((timeStr: string) => {
            if (!isToday) return true; 
            
            // If today, check the time
            let timePart = timeStr;
            if (timeStr.includes("T")) timePart = timeStr.split("T")[1] ?? timeStr;
            
            const [hStr, mStr] = timePart.split(":");
            const h = parseInt(hStr || "0", 10);
            const m = parseInt(mStr || "0", 10);

            if (h > currentHour) return true;
            if (h === currentHour && m > currentMinute) return true;
            
            return false; // Time has passed
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

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return "";
    let timePart = timeStr;
    if (timeStr.includes("T")) {
        const parts = timeStr.split("T");
        if (parts.length >= 2) {
            timePart = parts[1] || ""; 
        }
    }
    if (!timePart.includes(":")) return timePart;
    const [hoursStr = "0", minutesStr = "00"] = timePart.split(":");
    let hours = parseInt(hoursStr, 10);
    if (isNaN(hours)) return timePart;
    const minutes = minutesStr; 
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes} ${ampm}`;
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
      toast.success("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("This time slot was just booked by someone else.");
        // Refresh the list to remove the taken slot
        if (bookingMode === "custom" && selectedDate) {
             setAvailableTimeSlots([]); 
             // Trigger re-fetch logic here ideally
        }
      } else {
        toast.error(err?.response?.data?.detail || "Failed to create appointment");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    if (bookingMode === "availability") return selectedAvailabilitySlot !== null;
    return selectedCustomSlot !== null;
  };

  const avatarSrc = doctor?.avatar && doctor.avatar.trim() !== "" ? doctor.avatar : "/default-avatar.png";

  // === DATA PROCESSING FOR GROUPED VIEW ===
  
  // 1. Get unique dates
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    availabilities.forEach(slot => {
        const datePart = slot.date.split('T')[0] || "";
        if (datePart) {
            dates.add(datePart);
        }
    });
    return Array.from(dates);
  }, [availabilities]);

  // 2. Filter slots for active tab AND Check against real bookings
  const activeSlots = useMemo(() => {
    const todayStr = getLocalTodayStr();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return availabilities.filter(slot => {
        // A. Must match the selected date tab
        if (!slot.date.startsWith(activeDateTab)) return false;

        // B. Must NOT be in the past (Time check)
        if (activeDateTab === todayStr) {
             const [hStr, mStr] = slot.start_time.split(":");
             const h = parseInt(hStr || "0", 10);
             const m = parseInt(mStr || "0", 10);
             
             if (h < currentHour) return false;
             if (h === currentHour && m <= currentMinute) return false;
        }

        // C. Must be "Real" Available (Backend check)
        // If we fetched the real slots, verify this slot is in that list.
        // The backend returns "09:00:00". Our slot is "09:00:00".
        if (bookedSlotsForActiveTab.length > 0) {
            // If the slot's time is NOT in the list of available times from backend, hide it
            if (!bookedSlotsForActiveTab.includes(slot.start_time)) {
                return false; 
            }
        }

        return true;
    });
  }, [availabilities, activeDateTab, bookedSlotsForActiveTab]);

  // 3. Group by Morning / Afternoon
  const groupedSlots = useMemo(() => {
    const morning: DoctorAvailability[] = [];
    const afternoon: DoctorAvailability[] = [];
    
    activeSlots.forEach(slot => {
        const hourStr = slot.start_time.split(':')[0] || "0";
        const hour = parseInt(hourStr, 10);
        
        if (hour < 12) morning.push(slot);
        else afternoon.push(slot);
    });
    return { morning, afternoon };
  }, [activeSlots]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-b-blue-600"></div>
          <p className="text-slate-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Navbar/>
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        
        <div className="mb-6">
            <Link to="/patient/find-doctor" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Directory
            </Link>
        </div>
        
        {/* DOCTOR CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                    <img
                        src={avatarSrc}
                        alt={doctor.name}
                        className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-100"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }}
                    />
                    {doctor.is_verified && (
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900">Dr. {doctor.name}</h1>
                    <div className="flex flex-col gap-1 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-blue-500" />
                            {doctor.specializations || "General Practice"}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {doctor.address || "No address provided"}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* BOOKING AREA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header + Mode Toggle */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-slate-400" />
                        Select Appointment
                    </h2>
                    
                    <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                        <button
                            onClick={() => setBookingMode("availability")}
                            disabled={availabilities.length === 0}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                                bookingMode === "availability" 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : availabilities.length === 0 
                                        ? "text-slate-300 cursor-not-allowed" 
                                        : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Suggested
                        </button>
                        <button
                            onClick={() => setBookingMode("custom")}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                                bookingMode === "custom" 
                                    ? "bg-white text-slate-900 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            Custom Date
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                {/* === MODE 1: SUGGESTED SLOTS (GROUPED) === */}
                {bookingMode === "availability" && (
                    <div className="animate-fade-in">
                        
                        {/* 1. DATE TABS (Horizontal Scroll) */}
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-slate-200">
                            {uniqueDates.map((dateStr) => {
                                const d = new Date(dateStr);
                                const isActive = activeDateTab === dateStr;
                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setActiveDateTab(dateStr)}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border transition-all duration-200 ${
                                            isActive 
                                                ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <span className="text-xs font-bold uppercase opacity-60">
                                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <span className="text-lg font-bold">
                                            {d.getDate()}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* 2. TIME SLOTS (Grouped by Morning/Afternoon) */}
                        <div className="space-y-8">
                            
                            {/* Morning Group */}
                            {groupedSlots.morning.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Sun className="w-4 h-4" /> Morning
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {groupedSlots.morning.map(slot => {
                                            const isSelected = selectedAvailabilitySlot === slot.id;
                                            return (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => setSelectedAvailabilitySlot(slot.id)}
                                                    className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95 ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                                                    }`}
                                                >
                                                    {slot.start_time.slice(0,5)}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Afternoon Group */}
                            {groupedSlots.afternoon.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Moon className="w-4 h-4" /> Afternoon
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {groupedSlots.afternoon.map(slot => {
                                            const isSelected = selectedAvailabilitySlot === slot.id;
                                            return (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => setSelectedAvailabilitySlot(slot.id)}
                                                    className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95 ${
                                                        isSelected
                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                                                    }`}
                                                >
                                                     {/* 12-hour format helper */}
                                                     {formatTimeSlot(slot.start_time).split(' ')[0]} 
                                                     <span className="text-[10px] ml-0.5 opacity-80">{formatTimeSlot(slot.start_time).split(' ')[1]}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {groupedSlots.morning.length === 0 && groupedSlots.afternoon.length === 0 && (
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-500 text-sm">
                                    No available slots for this date.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* === MODE 2: CUSTOM DATE === */}
                {bookingMode === "custom" && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                Pick a Date
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={getLocalTodayStr()}
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {selectedDate && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                                    Available Time Slots
                                </label>
                                
                                {loadingSlots ? (
                                    <div className="py-8 text-center text-slate-400 text-sm">
                                        Checking availability...
                                    </div>
                                ) : availableTimeSlots.length === 0 ? (
                                    <div className="p-4 bg-orange-50 text-orange-800 text-sm font-medium rounded-xl border border-orange-100 flex items-center gap-3">
                                        <Info className="w-5 h-5 text-orange-500" />
                                        No slots available on this date.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {availableTimeSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedCustomSlot(slot)}
                                                className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all duration-200 ${
                                                    selectedCustomSlot === slot
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
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

                <hr className="border-slate-100 my-8" />

                {/* REASON INPUT */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                        Reason for Visit <span className="text-slate-300 font-normal normal-case ml-1">(Optional)</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe symptoms (e.g., fever, headache)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 h-24 resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                {/* CONFIRM BUTTON */}
                <button
                    disabled={!isFormValid() || submitting}
                    onClick={handleConfirmBooking}
                    className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                        !isFormValid() || submitting
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-xl active:translate-y-0.5"
                    }`}
                >
                    {submitting ? (
                        <>Processing...</>
                    ) : (
                        <>
                            Confirm Appointment <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;