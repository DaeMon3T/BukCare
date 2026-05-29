import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Stethoscope,
  Clock,
  AlertCircle,
  User as UserIcon,
  ChevronRight,
  Database,
  FileText,
  CalendarDays,
  Filter,
  CheckCircle2,
  ListChecks,
  XCircle,
  RefreshCw,
} from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

interface Patient {
    id: number;
    name: string;
    email: string;
    dob: string | null;
    picture: string | null;
}

interface Availability {
    id: number;
    date: string | null;
    day_of_week: string | null;
    start_time: string | null;
    end_time: string | null;
    is_available: boolean;
}

interface DoctorWithAvailability {
    user_id: number;
    name: string;
    specializations: string[];
    avatar: string | null;
    status: string;
    consultation_fee: number | null;
    availabilities: Availability[];
}

interface TodayWalkIn {
    id: number;
    patient_id: number;
    patient_name: string;
    patient_picture: string | null;
    doctor_id: number;
    doctor_name: string;
    appointment_date: string;
    status: string;
    reason: string | null;
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    confirmed: { label: "Waiting", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    in_progress: { label: "In Consultation", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    cancelled: { label: "Cancelled", bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
    pending: { label: "Pending", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WalkIn: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<DoctorWithAvailability[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  // --- FILTER STATES ---
  const [specFilter, setSpecFilter] = useState<string>("all");
  const [doctorSearch, setDoctorSearch] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0] || "");
  const [timeFilter, setTimeFilter] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  // --- TODAY'S QUEUE ---
  const [todayWalkins, setTodayWalkins] = useState<TodayWalkIn[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // --- REGISTRATION STATES ---
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    fname: "", lname: "", email: "", contact_number: "", dob: "", sex: ""
  });

  // --- FETCH DOCTORS ON MOUNT ---
  useEffect(() => {
    const fetchDoctors = async () => {
        try {
            const res = await api.get("/walk-ins/available-doctors");
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to load doctors", err);
        }
    };
    fetchDoctors();
  }, []);

  // --- FETCH TODAY'S WALK-IN QUEUE ---
  const fetchTodayQueue = async () => {
    setLoadingQueue(true);
    try {
        const res = await api.get("/walk-ins/today");
        setTodayWalkins(res.data);
    } catch (err: any) {
        if (err?.response?.status !== 403) {
            console.error("Failed to load today's queue", err);
        }
    } finally {
        setLoadingQueue(false);
    }
  };
  useEffect(() => { fetchTodayQueue(); }, []);

  // --- CANCEL A WALK-IN ---
  const handleCancelWalkin = async (id: number) => {
    const reason = window.prompt("Reason for cancelling this walk-in?");
    if (!reason || !reason.trim()) return;
    try {
        await api.patch(`/appointments/${id}/status`, { status: "cancelled", reason: reason.trim() });
        toast.success("Walk-in cancelled");
        fetchTodayQueue();
    } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Cancel failed");
    }
  };

  // --- DERIVED: All unique specializations ---
  const allSpecializations = useMemo(() => {
    const specs = new Set<string>();
    doctors.forEach(d => d.specializations.forEach(s => specs.add(s)));
    return Array.from(specs).sort();
  }, [doctors]);

  // --- DERIVED: Filtered doctors by specialization + name (no availability gate) ---
  // Staff can assign any approved doctor; availability is shown as a suggestion, not a filter.
  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter(doc => {
      if (specFilter !== "all" && !doc.specializations.includes(specFilter)) return false;
      if (query) {
        const haystack = `${doc.name} ${doc.specializations.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [doctors, specFilter, doctorSearch]);

  // --- Get suggested time slots for a doctor on the selected date ---
  const getSlotsForDoctor = (doc: DoctorWithAvailability): Availability[] => {
    const selectedDate = new Date(dateFilter);
    const dayName = DAYS_OF_WEEK[selectedDate.getDay()] || "";
    const dateStr = dateFilter;

    return doc.availabilities.filter(a => {
      if (a.date && a.date.startsWith(dateStr)) return true;
      if (a.day_of_week && a.day_of_week.toLowerCase() === dayName.toLowerCase()) return true;
      return false;
    });
  };

  // --- Apply a suggested slot: select the doctor and fill the time field ---
  const handlePickSlot = (doc: DoctorWithAvailability, slot: Availability) => {
    setSelectedDoctorId(doc.user_id);
    if (slot.date) {
      const d = slot.date.split("T")[0];
      if (d) setDateFilter(d);
    }
    if (slot.start_time) setTimeFilter(slot.start_time.slice(0, 5));
  };

  // --- SEARCH PATIENTS ---
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.length < 2) return;

    setSearching(true);
    try {
        const res = await api.get(`/walk-ins/patients/search?query=${encodeURIComponent(searchQuery)}`);
        setPatients(res.data);
    } catch (err: any) {
        setPatients([]);
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail;
        if (status === 403) {
            toast.error(detail || "No doctor has granted you access yet.");
        } else {
            toast.error(detail || "Search failed");
        }
    } finally {
        setSearching(false);
    }
  };

  // --- BOOK WALK-IN ---
  const handleBook = async () => {
    if (!selectedPatient || !selectedDoctorId || !reason.trim()) {
        toast.error("Please fill in all required fields");
        return;
    }

    // Combine date + time into a local-time ISO string (so backend parses the user's intended time)
    const [hStr, mStr] = timeFilter.split(":");
    const [yStr, monStr, dStr] = dateFilter.split("-");
    if (!hStr || !mStr || !yStr || !monStr || !dStr) {
        toast.error("Please pick a valid date and time");
        return;
    }
    const appointmentDate = new Date(
        Number(yStr), Number(monStr) - 1, Number(dStr),
        Number(hStr), Number(mStr), 0, 0
    );

    setBooking(true);
    try {
        await api.post("/walk-ins/book", {
            patient_id: selectedPatient.id,
            doctor_id: selectedDoctorId,
            appointment_date: appointmentDate.toISOString(),
            reason: reason,
            notes: notes,
            appointment_type: "walk_in"
        });
        toast.success("Walk-in appointment recorded successfully!");
        setSelectedPatient(null);
        setReason("");
        setNotes("");
        setPatients([]);
        setSearchQuery("");
        setSelectedDoctorId(null);
        fetchTodayQueue();
    } catch (err: any) {
        if (err?.response?.status === 409) {
            toast.error(err?.response?.data?.detail || "That time slot is already booked for this doctor.", { duration: 5000 });
        } else {
            toast.error(err?.response?.data?.detail || "Booking failed");
        }
    } finally {
        setBooking(false);
    }
  };

  // --- REGISTER PATIENT ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.fname || !registerForm.lname || !registerForm.email) {
        toast.error("Please fill in all required fields (Name and Email)");
        return;
    }

    setRegistering(true);
    try {
        const payload: any = { ...registerForm };
        if (payload.sex === "true") payload.sex = true;
        if (payload.sex === "false") payload.sex = false;
        if (payload.sex === "") payload.sex = null;

        const res = await api.post("/walk-ins/register", payload);
        toast.success("Patient registered successfully!");
        setShowRegisterModal(false);
        setRegisterForm({ fname: "", lname: "", email: "", contact_number: "", dob: "", sex: "" });
        
        // Auto-select the newly created patient to proceed with booking
        setSelectedPatient({
            id: res.data.patient.id,
            name: res.data.patient.name,
            email: res.data.patient.email,
            dob: res.data.patient.dob,
            picture: null
        });
        setSearchQuery(res.data.patient.email);
    } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
        setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[100px]" />
      </div>
      
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        
        {/* HEADER */}
        <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Walk-in Management</h1>
            <p className="text-slate-500 font-medium">Register and process physical patient arrivals.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* TODAY'S QUEUE */}
            <div className="lg:col-span-12">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <ListChecks className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Today's Walk-in Queue</h2>
                                <p className="text-xs text-slate-500 font-medium">{todayWalkins.length} appointment{todayWalkins.length === 1 ? "" : "s"} so far today</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchTodayQueue}
                            disabled={loadingQueue}
                            className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-all disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingQueue ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {todayWalkins.length === 0 ? (
                        <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-600">No walk-ins yet today</p>
                            <p className="text-xs text-slate-400">Booked walk-ins will appear here as they arrive.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                            {todayWalkins.map(w => {
                                const styles = STATUS_STYLES[w.status] || STATUS_STYLES.pending!;
                                const isFinal = w.status === "completed" || w.status === "cancelled";
                                const apptTime = new Date(w.appointment_date);
                                const timeStr = `${String(apptTime.getHours()).padStart(2, "0")}:${String(apptTime.getMinutes()).padStart(2, "0")}`;
                                return (
                                    <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 transition-all">
                                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                            <img src={w.patient_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.patient_name)}&background=random`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-slate-900 truncate">{w.patient_name}</p>
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                                    {styles.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">
                                                <span className="font-semibold text-slate-600">{timeStr}</span> &middot; {w.doctor_name}{w.reason ? ` — ${w.reason}` : ""}
                                            </p>
                                        </div>
                                        {!isFinal && (
                                            <button
                                                onClick={() => handleCancelWalkin(w.id)}
                                                className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                title="Cancel walk-in"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW WALK-IN SECTION */}
            <div className="lg:col-span-12">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">

                    {/* PRIMARY: Register a new walk-in */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black">New Walk-in</h2>
                            <p className="text-sm text-blue-100/90 font-medium">Register the patient in front of you, then assign an available doctor.</p>
                        </div>
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="w-full sm:w-auto px-7 py-3.5 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus className="w-5 h-5" /> Register Walk-in
                        </button>
                    </div>

                    {/* SECONDARY: returning patient lookup (collapsible) */}
                    <div className="mt-6">
                        <button
                            onClick={() => setShowSearch(s => !s)}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            <Search className="w-4 h-4" />
                            Returning patient? Look them up
                            <ChevronRight className={`w-4 h-4 transition-transform ${showSearch ? "rotate-90" : ""}`} />
                        </button>

                        <AnimatePresence initial={false}>
                            {showSearch && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-5">
                                        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                                            <div className="relative flex-1 group w-full">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search by Patient Name, Email, or Phone..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleSearch()}
                                                disabled={searching}
                                                className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/10 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                {searching ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Search Records"}
                                            </button>
                                        </div>

                                        {/* RESULTS */}
                                        {patients.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {patients.map((p) => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPatient(p)}
                                                        className={`group relative bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-lg ${selectedPatient?.id === p.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-100'}`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                                                                <img src={p.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`} alt={p.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="overflow-hidden">
                                                                <h4 className="font-bold text-slate-900 truncate">{p.name}</h4>
                                                                <p className="text-xs text-slate-500 truncate">{p.email}</p>
                                                                <p className="text-[10px] font-black text-blue-600 uppercase mt-1 tracking-wider">ID: 2026-{p.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                                                            <ChevronRight className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : searchQuery.length >= 2 && !searching ? (
                                            <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                                <h3 className="text-base font-bold text-slate-700">No existing record</h3>
                                                <p className="text-slate-500 text-sm mb-5">This looks like a new patient — register them instead.</p>
                                                <button onClick={() => setShowRegisterModal(true)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 mx-auto">
                                                    <UserPlus className="w-4 h-4 text-emerald-500" /> Register Walk-in
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center text-slate-400">
                                                <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-10" />
                                                <p className="font-medium text-sm">Type a name, email, or phone to find an existing patient.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* BOOKING MODAL */}
            {createPortal(
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-5 sm:p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative flex-none">
                                <div className="flex items-center gap-3 sm:gap-4 pr-12">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg bg-white/10 backdrop-blur-md flex-shrink-0">
                                        <img src={selectedPatient.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPatient.name)}&background=random`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1 opacity-80">Immediate Walk-in</div>
                                        <h3 className="text-xl sm:text-2xl font-bold truncate">{selectedPatient.name}</h3>
                                        <p className="text-xs sm:text-sm text-blue-100 opacity-80">Patient ID: 2026-{selectedPatient.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedPatient(null); setSelectedDoctorId(null); }} className="absolute top-4 right-4 sm:top-6 sm:right-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                    ✕
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                                
                                {/* DOCTOR SEARCH */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search doctor by name or specialization..."
                                        value={doctorSearch}
                                        onChange={(e) => setDoctorSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                                    />
                                </div>

                                {/* FILTERS ROW */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Filter className="w-4 h-4 text-blue-500" /> Specialization
                                        </label>
                                        <select
                                            value={specFilter}
                                            onChange={(e) => { setSpecFilter(e.target.value); setSelectedDoctorId(null); }}
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 appearance-none"
                                        >
                                            <option value="all">All Specializations</option>
                                            {allSpecializations.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-blue-500" /> Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateFilter}
                                            onChange={(e) => setDateFilter(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-blue-500" /> Time
                                        </label>
                                        <input
                                            type="time"
                                            value={timeFilter}
                                            onChange={(e) => setTimeFilter(e.target.value)}
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700"
                                        />
                                    </div>
                                </div>

                                {/* DOCTOR CARDS */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-blue-500" /> Select Physician ({filteredDoctors.length})
                                    </label>

                                    {filteredDoctors.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                                            {filteredDoctors.map(doc => {
                                                const slots = getSlotsForDoctor(doc);
                                                const isSelected = selectedDoctorId === doc.user_id;

                                                return (
                                                    <div
                                                        key={doc.user_id}
                                                        onClick={() => setSelectedDoctorId(doc.user_id)}
                                                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md ${
                                                            isSelected
                                                                ? "border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/10"
                                                                : "border-slate-100 bg-white hover:border-blue-200"
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-3 right-3">
                                                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                                                                <img
                                                                    src={doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=E0E7FF&color=4338CA`}
                                                                    alt={doc.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="overflow-hidden flex-1">
                                                                <p className="font-bold text-slate-900 text-sm truncate">Dr. {doc.name}</p>
                                                                <p className="text-xs text-blue-600 font-semibold truncate">
                                                                    {doc.specializations.join(", ")}
                                                                </p>
                                                            </div>
                                                            {doc.consultation_fee && (
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex-shrink-0">
                                                                    ₱{doc.consultation_fee}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Suggested availability slots (click to apply) */}
                                                        {slots.length > 0 ? (
                                                            <div className="mt-1">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Suggested times — tap to apply</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {slots.map((slot, i) => (
                                                                        <button
                                                                            key={i}
                                                                            type="button"
                                                                            onClick={(e) => { e.stopPropagation(); handlePickSlot(doc, slot); }}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-[10px] font-bold text-slate-600 border border-slate-200 hover:border-blue-300 transition-colors"
                                                                        >
                                                                            <Clock className="w-3 h-3" />
                                                                            {slot.start_time} – {slot.end_time}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">No set hours on this date — booking as a custom time.</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-amber-50 rounded-2xl text-amber-700 text-sm font-medium flex items-center gap-3 border border-amber-100">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold">No doctors match your search</p>
                                                <p className="text-xs opacity-80 mt-0.5">Try a different name or specialization.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* REASON */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-500" /> Consultation Reason
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g. Chronic cough, Routine physical check-up, Lab result review..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 resize-none"
                                    />
                                </div>

                                {/* NOTES */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" /> Additional Notes
                                    </label>
                                    <input 
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Internal notes for the physician..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 sm:p-8 pt-0 sm:pt-0 flex gap-3 sm:gap-4 flex-none">
                                <button
                                    onClick={() => { setSelectedPatient(null); setSelectedDoctorId(null); }}
                                    className="flex-1 py-3.5 sm:py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBook}
                                    disabled={booking || !selectedDoctorId || !reason.trim()}
                                    className="flex-1 py-3.5 sm:py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {booking ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></span> : "Process Booking"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}

            {/* REGISTRATION MODAL */}
            {createPortal(
            <AnimatePresence>
                {showRegisterModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative flex-none">
                                <h3 className="text-2xl font-bold">Register Walk-in Patient</h3>
                                <p className="text-emerald-100 mt-1 opacity-90 text-sm">Create a profile to book their appointment.</p>
                                <button onClick={() => setShowRegisterModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                    ✕
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                                <form id="register-form" onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">First Name *</label>
                                        <input type="text" required value={registerForm.fname} onChange={e => setRegisterForm({...registerForm, fname: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Last Name *</label>
                                        <input type="text" required value={registerForm.lname} onChange={e => setRegisterForm({...registerForm, lname: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address *</label>
                                        <input type="email" required value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                                        <input type="tel" value={registerForm.contact_number} onChange={e => setRegisterForm({...registerForm, contact_number: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                                        <input type="date" value={registerForm.dob} onChange={e => setRegisterForm({...registerForm, dob: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Sex</label>
                                        <select value={registerForm.sex} onChange={e => setRegisterForm({...registerForm, sex: e.target.value})} className="w-full p-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                                            <option value="">Select...</option>
                                            <option value="true">Male</option>
                                            <option value="false">Female</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex-none gap-3 flex flex-col sm:flex-row justify-end">
                                <button type="button" onClick={() => setShowRegisterModal(false)} className="px-6 py-3.5 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors w-full sm:w-auto">
                                    Cancel
                                </button>
                                <button 
                                    form="register-form"
                                    type="submit" 
                                    disabled={registering}
                                    className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    {registering ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <><UserPlus className="w-5 h-5" /> Register Patient</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}

        </div>
      </main>
    </div>
  );
};

export default WalkIn;
