import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext"; 
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import QuickActions from "@/components/QuickActions";
import HealthVitals from "@/components/thVitals";

import { 
  Calendar, 
  Clock, 
  Activity, 
  Stethoscope, 
  Brain, 
  Baby, 
  Eye, 
  Bone, 
  Heart, 
  Star, 
  Zap, 
  Quote,
  CheckCircle2, 
  Hourglass 
} from "lucide-react";
import toast from "react-hot-toast";

// --- TYPES ---
interface Doctor {
  doctor_id: number;
  name: string;
  specialization?: string;
  avatar?: string;
}

interface Appointment {
  id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string; 
}

interface HealthTip {
  category: string;
  text: string;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket(); // Hook into the live stream
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);

  const categories = [
    { name: "General", icon: <Stethoscope className="w-5 h-5" />, color: "bg-blue-100 text-blue-600", specialization: "General Practice" },
    { name: "Cardiology", icon: <Heart className="w-5 h-5" />, color: "bg-rose-100 text-rose-600", specialization: "Cardiology" },
    { name: "Neurology", icon: <Brain className="w-5 h-5" />, color: "bg-purple-100 text-purple-600", specialization: "Neurology" },
    { name: "Pediatrics", icon: <Baby className="w-5 h-5" />, color: "bg-amber-100 text-amber-600", specialization: "Pediatrics" },
    { name: "Orthopedics", icon: <Bone className="w-5 h-5" />, color: "bg-slate-100 text-slate-600", specialization: "Orthopedics" },
    { name: "Eye Care", icon: <Eye className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-600", specialization: "Ophthalmology" },
  ];

  // 1. DATA FETCHING LOGIC (Wrapped in useCallback for stability)
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    try {
        if (!isBackground) setLoading(true);

        // Fetch everything in parallel
        const [doctorsRes, apptRes, tipRes] = await Promise.allSettled([
            api.get("/doctors/"),
            api.get("/appointments/"),
            api.get("/tips/daily")
        ]);

        // Process Doctors
        if (doctorsRes.status === "fulfilled") {
            setDoctors(doctorsRes.value.data.slice(0, 4));
        }

        // Process Tip
        if (tipRes.status === "fulfilled") {
            setHealthTip(tipRes.value.data);
        } else {
            setHealthTip({ category: "General", text: "Small steps lead to big changes!" });
        }

        // Process Appointments & Stats
        if (apptRes.status === "fulfilled") {
            const allAppts = apptRes.value.data;
            
            setStats({
                total: allAppts.length,
                pending: allAppts.filter((a: any) => a.status === "pending").length,
                completed: allAppts.filter((a: any) => a.status === "completed").length,
            });

            // Logic to find the "Hero" appointment (Next one in the future)
            const upcoming = allAppts
                .filter((a: any) => {
                    const apptDate = new Date(a.appointment_date);
                    const now = new Date();
                    return apptDate > now && 
                           a.status !== 'cancelled' && 
                           a.status !== 'completed';
                })
                .sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
            
            setNextAppointment(upcoming[0] || null);
        }

    } catch (error: any) {
        console.error("Dashboard error:", error);
    } finally {
        if (!isBackground) setLoading(false);
    }
  }, []);

  // 2. INITIAL MOUNT
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // 3. REAL-TIME LISTENER
  // This listens for signals from the backend (Doctor accepted, new booking, etc.)
  useEffect(() => {
    if (lastMessage) {
        if (lastMessage.type === "APPOINTMENT_UPDATE" || lastMessage.type === "NEW_APPOINTMENT") {
            // Refresh data silently (no loading spinner)
            fetchDashboardData(true);
            
            if (lastMessage.status === "confirmed") {
                toast.success("Good news! Your appointment was confirmed. 🎉");
            } else if (lastMessage.status === "completed") {
                toast.success("Appointment marked as completed.");
            }
        }
    }
  }, [lastMessage, fetchDashboardData]);

  // Helpers
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, <span className="text-blue-600">{user?.fname || "Patient"}</span>
            </h1>
            <p className="text-slate-500 mt-1">Here is your daily health overview.</p>
          </div>
        </div>

        {/* HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: UP NEXT (Dynamic Hero Card) */}
            <div className="lg:col-span-2">
                {nextAppointment ? (
                    <div className={`h-full rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all hover:shadow-2xl ${
                        nextAppointment.status === 'confirmed' 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-700" // Blue for Confirmed
                        : "bg-gradient-to-r from-amber-500 to-orange-600" // Amber for Pending
                    }`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 uppercase">
                                        UPCOMING APPOINTMENT
                                    </span>
                                    {/* LIVE STATUS BADGE */}
                                    {nextAppointment.status === 'confirmed' ? (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full text-xs font-bold border border-emerald-400/30 text-emerald-50 animate-in fade-in zoom-in">
                                            <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-3 py-1 bg-black/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 animate-in fade-in zoom-in">
                                            <Hourglass className="w-3 h-3" /> PENDING APPROVAL
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-2xl md:text-3xl font-bold mb-2">Dr. {nextAppointment.doctor_name}</h2>
                                <div className="flex flex-wrap gap-4 text-blue-50">
                                    <p className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                                        <Calendar className="w-4 h-4" /> 
                                        {formatDate(nextAppointment.appointment_date)}
                                    </p>
                                    <p className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                                        <Clock className="w-4 h-4" />
                                        {new Date(nextAppointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => navigate('/patient/appointments')}
                                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg flex-1 sm:flex-none text-center"
                                >
                                    View Details
                                </button>
                                <button 
                                    onClick={() => navigate('/patient/messages')}
                                    className="px-6 py-3 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-colors flex-1 sm:flex-none text-center"
                                >
                                    Message Doctor
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden min-h-[300px]">
                    <div className="flex gap-2 self-end mb-4 md:mb-0 z-20">
                        <div className="px-3 py-2 md:px-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                            <span className="text-xl md:text-2xl font-bold text-blue-500">{stats.pending}</span>
                        </div>
                        <div className="px-3 py-2 md:px-4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
                            <span className="text-xl md:text-2xl font-bold text-blue-500">{stats.completed}</span>
                        </div>
                    </div>
                    <div className="relative z-10 flex-1 flex flex-col justify-center items-start">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                            No Upcoming Visits
                        </h2>
                        <p className="text-slate-500 mb-6 md:mb-8 max-w-md leading-relaxed text-sm md:text-base">
                            You are all caught up! If you are feeling unwell or need a routine checkup, our doctors are here to help.
                        </p>
                        <button 
                            onClick={() => navigate('/patient/find-doctor')}
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 md:px-8 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            <Stethoscope className="w-5 h-5" />
                            Find a Doctor
                        </button>
                    </div>
                    <div className="absolute -right-6 -bottom-6 md:right-[-20px] md:bottom-[-40px] opacity-5 pointer-events-none">
                        <Stethoscope className="w-48 h-48 md:w-80 md:h-80 text-blue-600" />
                    </div>
                </div>
                )}
            </div>

            {/* RIGHT: SMART HEALTH TIP */}
            <div className="flex flex-col gap-6">
                <div className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-500 group h-full flex flex-col justify-center ${
                    healthTip?.category === "Morning" ? "bg-amber-50 border-amber-100 text-amber-900" :
                    healthTip?.category === "Evening" ? "bg-indigo-50 border-indigo-100 text-indigo-900" :
                    "bg-emerald-50 border-emerald-100 text-emerald-900"
                }`}>
                    <Quote className={`absolute top-4 right-4 w-12 h-12 rotate-180 opacity-10`} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 opacity-80">
                            <Zap className="w-4 h-4 fill-current" />
                            <span className="font-bold text-xs tracking-wider uppercase">
                                {healthTip?.category || "Daily"} Insight
                            </span>
                        </div>
                        <p className="font-medium text-lg leading-relaxed mb-4">
                            "{healthTip?.text || "Stay consistent with your health journey!"}"
                        </p>
                        <div className="text-xs font-semibold opacity-60">
                            — BukCare AI Companion
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* QUICK ACTIONS */}
        <QuickActions />

        {/* HEALTH VITALS */}
        <HealthVitals />

        {/* CATEGORIES */}
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Browse Specialists
            </h3>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
                {categories.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => navigate(`/patient/find-doctor?specialization=${encodeURIComponent(cat.specialization)}`)}
                        className="min-w-[130px] flex-shrink-0 lg:min-w-0 lg:flex-shrink flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
                    >
                        <div className={`p-3 rounded-full mb-3 ${cat.color} group-hover:scale-110 transition-transform`}>
                            {cat.icon}
                        </div>
                        <span className="font-medium text-slate-700 text-sm whitespace-nowrap">{cat.name}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* TOP DOCTORS */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recommended Doctors</h3>
                <button onClick={() => navigate('/patient/find-doctor')} className="text-sm font-semibold text-blue-600 hover:underline">See All</button>
            </div>
            
                <div className="flex overflow-x-auto pb-6 gap-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
                    {doctors.map((doc) => (
                        <div key={doc.doctor_id} className="min-w-[280px] snap-center flex">
                            
                            <div className="w-full bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <img 
                                        src={doc.avatar || "/default-avatar.png"} 
                                        alt={doc.name}
                                        className="w-14 h-14 rounded-full object-cover bg-slate-100 border border-slate-100 shrink-0"
                                        onError={(e) => (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"} 
                                    />
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-slate-900 truncate">Dr. {doc.name}</h4>
                                        
                                        <p className="text-xs text-slate-500 truncate">
                                            {doc.specialization || doc.specialization || "General Practice"}
                                        </p>
                                        
                                        <div className="flex items-center gap-1 mt-1 text-amber-400">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="text-xs font-bold text-slate-700">Appoint To Review</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => navigate(`/patient/book/${doc.doctor_id}`)}
                                    className="mt-auto w-full py-2.5 bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    Book Visit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;