import React, { useState, useEffect } from "react";
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
  FileText
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

interface Doctor {
    user_id: number;
    name: string;
    specialization: string;
    status: string;
}

const WalkIn: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

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
            const res = await api.get("/doctor/list"); // Assumption: there's an endpoint to list doctors
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to load doctors", err);
        }
    };
    fetchDoctors();
  }, []);

  // --- SEARCH PATIENTS ---
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.length < 2) return;

    setSearching(true);
    try {
        const res = await api.get(`/walk-ins/patients/search?query=${searchQuery}`);
        setPatients(res.data);
    } catch (err) {
        toast.error("Search failed");
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

    setBooking(true);
    try {
        await api.post("/walk-ins/book", {
            patient_id: selectedPatient.id,
            doctor_id: selectedDoctorId,
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
    } catch (err: any) {
        toast.error(err?.response?.data?.message || "Booking failed");
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
            
            {/* SEARCH SECTION */}
            <div className="lg:col-span-12">
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center mb-8">
                        <div className="relative flex-1 group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search by Patient Name, Email, or ID..."
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
                    <AnimatePresence mode="wait">
                        {patients.length > 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {patients.map((p) => (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedPatient(p)}
                                        className={`group relative bg-white p-5 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-lg ${selectedPatient?.id === p.id ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-50 hover:border-blue-100'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-inner">
                                                <img src={p.picture || `https://ui-avatars.com/api/?name=${p.name}&background=random`} alt={p.name} className="w-full h-full object-cover" />
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
                            </motion.div>
                        ) : searchQuery.length >= 2 && !searching ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"
                            >
                                <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No Patient Records Found</h3>
                                <p className="text-slate-500 text-sm mb-6">Make sure the name or ID is correct.</p>
                                <button onClick={() => setShowRegisterModal(true)} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 mx-auto">
                                    <UserPlus className="w-4 h-4 text-emerald-500" /> Create New Profile
                                </button>
                            </motion.div>
                        ) : (
                            <div className="py-20 text-center text-slate-400">
                                <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-10" />
                                <p className="font-medium">Enter patient details above to retrieve medical records.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* BOOKING DRAWER / MODAL */}
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg bg-white/10 backdrop-blur-md flex-shrink-0">
                                        <img src={selectedPatient.picture || `https://ui-avatars.com/api/?name=${selectedPatient.name}&background=random`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1 opacity-80">Immediate Walk-in</div>
                                        <h3 className="text-2xl font-bold">{selectedPatient.name}</h3>
                                        <p className="text-sm text-blue-100 opacity-80">Patient ID: 2026-{selectedPatient.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                                    ✕
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Stethoscope className="w-4 h-4 text-blue-500" /> Assign Physician
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {doctors.length > 0 ? (
                                            <select 
                                                value={selectedDoctorId || ""} 
                                                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-slate-700 appearance-none"
                                            >
                                                <option value="">Select Doctor...</option>
                                                {doctors.map(d => (
                                                    <option key={d.user_id} value={d.user_id}>
                                                        Dr. {d.name} ({d.specialization})
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="p-4 bg-amber-50 rounded-2xl text-amber-700 text-sm font-medium flex items-center gap-2 border border-amber-100">
                                                <AlertCircle className="w-4 h-4" /> No physicians available.
                                            </div>
                                        )}
                                    </div>
                                </div>

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
                            <div className="p-8 pt-0 flex gap-4">
                                <button 
                                    onClick={() => setSelectedPatient(null)} 
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleBook}
                                    disabled={booking || !selectedDoctorId || !reason.trim()}
                                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {booking ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></span> : "Process Booking"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* REGISTRATION MODAL */}
            <AnimatePresence>
                {showRegisterModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
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
            </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

export default WalkIn;
