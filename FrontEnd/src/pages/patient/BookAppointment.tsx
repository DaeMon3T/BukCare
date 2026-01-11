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
    ChevronRight,
    CalendarDays,
    Sun,
    Moon,
    Clock
} from "lucide-react";

type BookingMode = "availability" | "custom";

const BookAppointment: React.FC = () => {
  const { doctor_id } = useParams<{ doctor_id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  
  const [bookingMode, setBookingMode] = useState<BookingMode>("availability");
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<number | null>(null);
  
  const [activeDateTab, setActiveDateTab] = useState<string>("");
  const [serverAvailableSlots, setServerAvailableSlots] = useState<string[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([]);
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

  // --- Generate Full Day Slots for Custom Mode ---
  const generateAllDaySlots = () => {
    const slots = [];
    for (let i = 8; i <= 16; i++) {
        if (i === 12) continue;

        const hour = i < 10 ? `0${i}` : `${i}`;
        slots.push(`${hour}:00:00`);
    }
    return slots;
  };

  const formatTimeSlot = (timeStr: string) => {
    if (!timeStr) return "";
    let timePart = timeStr;
    if (timeStr.includes("T")) timePart = timeStr.split("T")[1] || "";
    if (!timePart.includes(":")) return timePart;
    
    const [hoursStr, minutesStr] = timePart.split(":");
    let hours = parseInt(hoursStr || "0", 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; 
    return `${hours}:${minutesStr} ${ampm}`;
  };

  // 1. Initial Load
  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);
        const doctorData = await GetDoctorAPI.getDoctorById(doctorId);
        const todayStr = getLocalTodayStr(); 

        let validAvailabilities = (doctorData.availabilities || []).filter((slot) => {
            if (!slot.date || !slot.start_time) return false;
            const slotDate = slot.date.split("T")[0] ?? "";
            if (slotDate < todayStr) return false; 
            return true;
        });

        validAvailabilities.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return a.start_time.localeCompare(b.start_time);
        });

        setDoctor(doctorData);
        setAvailabilities(validAvailabilities);
        
        if (validAvailabilities.length > 0) {
            const firstSlot = validAvailabilities[0];
            // 🛡️ FIX: Added optional chaining here to prevent 'undefined' error
            const firstDate = firstSlot?.date ? firstSlot.date.split('T')[0] : ""; 
            if (firstDate) {
                setActiveDateTab(firstDate);
                setBookingMode("availability");
            }
        } else {
            setBookingMode("custom");
        }

      } catch (error) {
        console.error("Error loading doctor data:", error);
        toast.error("Failed to load details");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  // 2. Inventory Check
  useEffect(() => {
    const targetDate = bookingMode === "availability" ? activeDateTab : selectedDate;
    if (!doctorId || !targetDate) return;

    const fetchInventory = async () => {
        try {
            setLoadingSlots(true);
            const response = await AppointmentAvailabilityAPI.getAvailableSlots(
                doctorId,
                targetDate
            );
            setServerAvailableSlots(response.available_slots || []); 
        } catch (error) {
            console.error("Inventory check failed", error);
            setServerAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };
    fetchInventory();
  }, [doctorId, activeDateTab, selectedDate, bookingMode]);

  // 3. Custom Slot Generation
  useEffect(() => {
    if (bookingMode === "custom" && selectedDate) {
        const fullDaySlots = generateAllDaySlots();
        setCustomTimeSlots(fullDaySlots);
    }
  }, [selectedDate, bookingMode]);

  const handleConfirmBooking = async () => {
    if (!doctorId) return;
    let appointmentDateTime: string;
    
    if (bookingMode === "availability") {
      if (selectedAvailabilitySlot === null) {
        toast.error("Please select a schedule slot");
        return;
      }
      const slot = availabilities.find((a) => a.id === selectedAvailabilitySlot);
      if (!slot) return;
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
      await api.post("/appointments", {
        doctor_id: doctorId,
        appointment_date: appointmentDateTime,
        reason: reason || null,
      });
      
      toast.success("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error("This time slot is already booked.");
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

  // === DERIVED STATE (Optimized Filtering) ===
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    availabilities.forEach(slot => {
        const datePart = slot.date.split('T')[0] || "";
        if (datePart) dates.add(datePart);
    });
    return Array.from(dates);
  }, [availabilities]);

  const activeSlots = useMemo(() => {
    const todayStr = getLocalTodayStr();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return availabilities.filter(slot => {
        // A. Match Date Tab
        if (!slot.date.startsWith(activeDateTab)) return false;

        // B. Time Check (Past)
        if (activeDateTab === todayStr) {
             const [hStr, mStr] = slot.start_time.split(":");
             const h = parseInt(hStr || "0", 10);
             const m = parseInt(mStr || "0", 10);
             if (h < currentHour) return false;
             if (h === currentHour && m <= currentMinute) return false;
        }

        // C. INVENTORY CHECK (Fixed)
        // Only filter if we actually have data from the server.
        // If serverAvailableSlots is empty, we assume the API isn't filtering, so we show the slot.
        if (serverAvailableSlots.length > 0) {
            const cleanSlotTime = slot.start_time.length === 5 ? slot.start_time + ":00" : slot.start_time;
            // Check if server list contains this time
            const isAvailable = serverAvailableSlots.some(t => t.startsWith(cleanSlotTime.substring(0, 5)));
            
            if (!isAvailable) return false; 
        } 
        
        // ❌ DELETED the "else if (!loadingSlots)" block here.
        // This prevents the "Invisible Slots" bug when the API returns an empty array.

        return true;
    });
  }, [availabilities, activeDateTab, serverAvailableSlots, loadingSlots]);

  const groupedSlots = useMemo(() => {
    const morning: DoctorAvailability[] = [];
    const afternoon: DoctorAvailability[] = [];
    activeSlots.forEach(slot => {
        const hour = parseInt(slot.start_time.split(':')[0] || "0", 10);
        if (hour < 12) morning.push(slot);
        else afternoon.push(slot);
    });
    return { morning, afternoon };
  }, [activeSlots]);

  if (loading) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-b-blue-600"></div>
      </div>
  );

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
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                    <img src={avatarSrc} alt={doctor.name} className="w-24 h-24 rounded-2xl object-cover bg-slate-100 border border-slate-100" onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }} />
                    {doctor.is_verified && <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-full border-2 border-white"><Check className="w-3 h-3" /></div>}
                </div>
                <div className="flex-1 space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900">Dr. {doctor.name}</h1>
                    <div className="flex flex-col gap-1 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-500" /> {doctor.specializations || "General Practice"}</div>
                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {doctor.address || "No address provided"}</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-slate-400" /> Select Appointment
                    </h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
                        <button onClick={() => setBookingMode("availability")} disabled={availabilities.length === 0} className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${bookingMode === "availability" ? "bg-white text-slate-900 shadow-sm" : availabilities.length === 0 ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-slate-700"}`}>Suggested</button>
                        <button onClick={() => setBookingMode("custom")} className={`px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${bookingMode === "custom" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Custom Date</button>
                    </div>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                {bookingMode === "availability" && (
                    <div className="animate-fade-in">
                        <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-slate-200">
                            {uniqueDates.map((dateStr) => {
                                const d = new Date(dateStr);
                                const isActive = activeDateTab === dateStr;
                                return (
                                    <button key={dateStr} onClick={() => setActiveDateTab(dateStr)} className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] p-3 rounded-xl border transition-all duration-200 ${isActive ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                                        <span className="text-xs font-bold uppercase opacity-60">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <span className="text-lg font-bold">{d.getDate()}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="space-y-8">
                            {loadingSlots ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-b-blue-600 mx-auto mb-2"></div>
                                    <span className="text-slate-400 text-sm">Checking availability...</span>
                                </div>
                            ) : (
                                <>
                                    {groupedSlots.morning.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Sun className="w-4 h-4" /> Morning</h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                                {groupedSlots.morning.map(slot => (
                                                    <button key={slot.id} onClick={() => setSelectedAvailabilitySlot(slot.id)} className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95 ${selectedAvailabilitySlot === slot.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"}`}>
                                                        {formatTimeSlot(slot.start_time).split(' ')[0]} <span className="text-[10px] opacity-80">{formatTimeSlot(slot.start_time).split(' ')[1]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {groupedSlots.afternoon.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Moon className="w-4 h-4" /> Afternoon</h3>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                                {groupedSlots.afternoon.map(slot => (
                                                    <button key={slot.id} onClick={() => setSelectedAvailabilitySlot(slot.id)} className={`py-2.5 px-2 rounded-lg text-sm font-bold border transition-all duration-200 active:scale-95 ${selectedAvailabilitySlot === slot.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"}`}>
                                                        {formatTimeSlot(slot.start_time).split(' ')[0]} <span className="text-[10px] opacity-80">{formatTimeSlot(slot.start_time).split(' ')[1]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {groupedSlots.morning.length === 0 && groupedSlots.afternoon.length === 0 && (
                                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-500 text-sm">
                                            No available slots for this date.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {bookingMode === "custom" && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Pick a Date</label>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={getLocalTodayStr()} className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        {selectedDate && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Select Time (Anytime)
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                    {customTimeSlots.map((slot) => (
                                        <button key={slot} onClick={() => setSelectedCustomSlot(slot)} className={`py-2 px-2 rounded-lg text-sm font-bold border transition-all duration-200 ${selectedCustomSlot === slot ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"}`}>
                                            {formatTimeSlot(slot)}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 italic">* You can select times outside the doctor's standard schedule.</p>
                            </div>
                        )}
                    </div>
                )}

                <hr className="border-slate-100 my-8" />

                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Reason for Visit <span className="text-slate-300 font-normal normal-case ml-1">(Optional)</span></label>
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe symptoms..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 h-24 resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>

                <button disabled={!isFormValid() || submitting} onClick={handleConfirmBooking} className={`w-full py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-200 ${!isFormValid() || submitting ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"}`}>
                    {submitting ? "Processing..." : <>Confirm Appointment <ChevronRight className="w-5 h-5" /></>}
                </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;