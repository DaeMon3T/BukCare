import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext"; 
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import QuickActions from "@/components/QuickActions";
import HealthVitals from "@/components/thVitals";
import MedicalIDCard from '@/components/MedicalIDCard';

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
  Hourglass,
  QrCode, 
  X
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
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [showMedicalID, setShowMedicalID] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);

  const categories = [
    { name: "General", icon: <Stethoscope className="w-5 h-5" />, color: "bg-blue-500/10 text-blue-600", specialization: "General Practice" },
    { name: "Cardiology", icon: <Heart className="w-5 h-5" />, color: "bg-rose-500/10 text-rose-600", specialization: "Cardiology" },
    { name: "Neurology", icon: <Brain className="w-5 h-5" />, color: "bg-purple-500/10 text-purple-600", specialization: "Neurology" },
    { name: "Pediatrics", icon: <Baby className="w-5 h-5" />, color: "bg-amber-500/10 text-amber-600", specialization: "Pediatrics" },
    { name: "Orthopedics", icon: <Bone className="w-5 h-5" />, color: "bg-slate-500/10 text-slate-600", specialization: "Orthopedics" },
    { name: "Eye Care", icon: <Eye className="w-5 h-5" />, color: "bg-emerald-500/10 text-emerald-600", specialization: "Ophthalmology" },
  ];

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    try {
        if (!isBackground) setLoading(true);

        const [doctorsRes, apptRes, tipRes] = await Promise.allSettled([
            api.get("/doctors/"),
            api.get("/appointments/"),
            api.get("/tips/daily")
        ]);

        if (doctorsRes.status === "fulfilled") setDoctors(doctorsRes.value.data.slice(0, 4));
        if (tipRes.status === "fulfilled") setHealthTip(tipRes.value.data);
        else setHealthTip({ category: "General", text: "Small steps lead to big changes!" });

        if (apptRes.status === "fulfilled") {
            const allAppts = apptRes.value.data;
            setStats({
                total: allAppts.length,
                pending: allAppts.filter((a: any) => a.status === "pending").length,
                completed: allAppts.filter((a: any) => a.status === "completed").length,
            });

            const upcoming = allAppts
                .filter((a: any) => {
                    const apptDate = new Date(a.appointment_date);
                    const now = new Date();
                    return apptDate > now && a.status !== 'cancelled' && a.status !== 'completed';
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

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (lastMessage && (lastMessage.type === "APPOINTMENT_UPDATE" || lastMessage.type === "NEW_APPOINTMENT")) {
        fetchDashboardData(true);
        if (lastMessage.status === "confirmed") toast.success("Good news! Your appointment was confirmed.");
        else if (lastMessage.status === "completed") toast.success("Appointment marked as completed.");
    }
  }, [lastMessage, fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    // ✨ GLASSMORPHISM BACKGROUND WRAPPER
    <div className="min-h-screen bg-[#F0F4F8] pb-20 relative overflow-hidden font-sans text-slate-800">
      
      {/* 🎨 AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* --- MEDICAL ID MODAL --- */}
        {showMedicalID && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setShowMedicalID(false)}
                ></div>
                
                <div className="relative z-10 animate-in fade-in zoom-in-95 duration-300 ease-out transform scale-110"> 
                    <button 
                        onClick={() => setShowMedicalID(false)}
                        className="absolute -top-6 -right-6 bg-white/80 backdrop-blur-md text-slate-700 p-2 rounded-full shadow-lg hover:bg-white hover:text-red-600 transition-all z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                
                    <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/50">
                        <MedicalIDCard />
                    </div>
                </div>
            </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user?.fname || "Patient"}</span>
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Your personal health overview for today.</p>
            </div>
            
            {/* GLASSY QR BUTTON */}
            <button 
                onClick={() => setShowMedicalID(true)}
                className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/50 text-slate-800 px-5 py-3 rounded-2xl font-bold hover:bg-white transition-all shadow-sm hover:shadow-lg group"
            >
                <QrCode className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                <span>My Medical ID</span>
            </button>
            </div>
            
            {/* HERO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: UP NEXT (Glass Card) */}
                <div className="lg:col-span-2">
                    {nextAppointment ? (
                        <div className={`h-full rounded-[2rem] p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1 ${
                            nextAppointment.status === 'confirmed' 
                            ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                            : "bg-gradient-to-br from-amber-500 to-orange-600"
                        }`}>
                            {/* Glass Reflections */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
                            
                            <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 uppercase shadow-inner">
                                            UPCOMING
                                        </span>
                                        {nextAppointment.status === 'confirmed' ? (
                                            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-400/20 backdrop-blur-md rounded-full text-xs font-bold border border-emerald-400/30 text-emerald-50 shadow-inner">
                                                <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 px-3 py-1 bg-black/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/10 shadow-inner">
                                                <Hourglass className="w-3 h-3" /> PENDING
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-bold mb-2">Dr. {nextAppointment.doctor_name}</h2>
                                    <div className="flex flex-wrap gap-3 text-blue-50 mt-4">
                                        <p className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                                            <Calendar className="w-4 h-4" /> 
                                            {formatDate(nextAppointment.appointment_date)}
                                        </p>
                                        <p className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
                                            <Clock className="w-4 h-4" />
                                            {new Date(nextAppointment.appointment_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => navigate('/patient/appointments')}
                                        className="bg-white text-blue-700 px-6 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-black/5 flex-1 sm:flex-none text-center"
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        onClick={() => navigate('/patient/messages')}
                                        className="px-6 py-3.5 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-colors flex-1 sm:flex-none text-center backdrop-blur-sm"
                                    >
                                        Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-sm flex flex-col relative overflow-hidden min-h-[300px]">
                                <div className="flex gap-3 self-end mb-4 md:mb-0 z-20">
                                    <div className="px-4 py-3 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 flex flex-col items-center min-w-[80px]">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                                        <span className="text-2xl font-bold text-blue-600">{stats.pending}</span>
                                    </div>
                                    <div className="px-4 py-3 bg-white/50 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 flex flex-col items-center min-w-[80px]">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Done</span>
                                        <span className="text-2xl font-bold text-emerald-600">{stats.completed}</span>
                                    </div>
                                </div>
                                <div className="relative z-10 flex-1 flex flex-col justify-center items-start">
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">No Upcoming Visits</h2>
                                    <p className="text-slate-500 mb-8 max-w-md">You are all caught up! If you are feeling unwell, our doctors are here to help.</p>
                                    <button onClick={() => navigate('/patient/find-doctor')} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 flex items-center gap-2 transition-all hover:scale-105">
                                        <Stethoscope className="w-5 h-5" /> Find a Doctor
                                    </button>
                                </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: SMART HEALTH TIP (Glass Card) */}
                <div className="flex flex-col gap-6">
                    <div className={`h-full rounded-[2rem] p-8 border border-white/50 relative overflow-hidden transition-all duration-500 group flex flex-col justify-center backdrop-blur-xl shadow-sm hover:shadow-md ${
                        healthTip?.category === "Morning" ? "bg-amber-100/60 text-amber-900" :
                        healthTip?.category === "Evening" ? "bg-indigo-100/60 text-indigo-900" :
                        "bg-emerald-100/60 text-emerald-900"
                    }`}>
                        <Quote className="absolute top-6 right-6 w-16 h-16 rotate-180 opacity-10 mix-blend-multiply" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 opacity-70">
                                <Zap className="w-4 h-4 fill-current" />
                                <span className="font-bold text-xs tracking-wider uppercase">{healthTip?.category || "Daily"} Insight</span>
                            </div>
                            <p className="font-medium text-xl leading-relaxed mb-6">"{healthTip?.text || "Stay consistent with your health journey!"}"</p>
                            <div className="flex items-center gap-2 opacity-60">
                                <div className="w-6 h-6 rounded-full bg-current opacity-20"></div>
                                <span className="text-xs font-bold uppercase tracking-wide">BukCare AI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS & VITALS */}
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-sm">
                <QuickActions />
            </div>
            
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-sm">
                <HealthVitals />
            </div>

            {/* CATEGORIES */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-500" /> Browse Specialists
                </h3>
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide lg:grid lg:grid-cols-6 lg:gap-4 lg:overflow-visible">
                    {categories.map((cat) => (
                        <button key={cat.name} onClick={() => navigate(`/patient/find-doctor?specialization=${encodeURIComponent(cat.specialization)}`)} className="min-w-[140px] flex-shrink-0 lg:min-w-0 lg:flex-shrink flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-md border border-white/60 rounded-3xl hover:border-blue-300 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all group">
                            <div className={`p-4 rounded-2xl mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                            <span className="font-bold text-slate-700 text-sm whitespace-nowrap">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TOP DOCTORS */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Recommended Doctors</h3>
                    <button onClick={() => navigate('/patient/find-doctor')} className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-colors">See All</button>
                </div>
                <div className="flex overflow-x-auto pb-8 gap-5 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
                    {doctors.map((doc) => (
                        <div key={doc.doctor_id} className="min-w-[300px] snap-center flex">
                            <div className="w-full bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="relative">
                                        <img src={doc.avatar || "/default-avatar.png"} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-inner" onError={(e) => (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"} />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-lg text-slate-900 truncate">Dr. {doc.name}</h4>
                                        <p className="text-sm text-slate-500 truncate font-medium">{doc.specialization || "General Practice"}</p>
                                        <div className="flex items-center gap-1 mt-1 text-amber-500 bg-amber-50 w-fit px-2 py-0.5 rounded-md"><Star className="w-3 h-3 fill-current" /><span className="text-xs font-bold text-slate-700">4.8</span></div>
                                    </div>
                                </div>
                                <button onClick={() => navigate(`/patient/book/${doc.doctor_id}`)} className="mt-auto w-full py-3.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-blue-200">Book Visit</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;