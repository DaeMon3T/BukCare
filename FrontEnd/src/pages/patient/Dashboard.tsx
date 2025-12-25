import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import { 
  Calendar, 
  Clock, 
  User, 
  Heart, 
  Activity, 
  Stethoscope,
  Brain,
  Baby,
  Eye,
  Bone,
  ArrowRight,
  Star,
  Zap,
  Quote
} from "lucide-react";
import toast from "react-hot-toast";

// --- TYPES & INTERFACES ---
interface Doctor {
  doctor_id: number;
  name: string;
  specialization?: string;
  years_of_experience?: number;
  is_verified: boolean;
  address?: string;
  avatar?: string;
}

interface Appointment {
  id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
}

// ✅ NEW: Interface for the Smart Tip
interface HealthTip {
  category: "Morning" | "Afternoon" | "Evening" | "General" | "Cardiology" | "Dermatology" | string;
  text: string;
  source?: string;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  
  // ✅ FIXED STATE: Typed correctly as HealthTip object or null
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);

  // Categories Config
  const categories = [
    { name: "General", icon: <Stethoscope className="w-5 h-5" />, color: "bg-blue-100 text-blue-600", specialization: "General Practice" },
    { name: "Cardiology", icon: <Heart className="w-5 h-5" />, color: "bg-rose-100 text-rose-600", specialization: "Cardiology" },
    { name: "Neurology", icon: <Brain className="w-5 h-5" />, color: "bg-purple-100 text-purple-600", specialization: "Neurology" },
    { name: "Pediatrics", icon: <Baby className="w-5 h-5" />, color: "bg-amber-100 text-amber-600", specialization: "Pediatrics" },
    { name: "Orthopedics", icon: <Bone className="w-5 h-5" />, color: "bg-slate-100 text-slate-600", specialization: "Orthopedics" },
    { name: "Eye Care", icon: <Eye className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-600", specialization: "Ophthalmology" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Doctors
      try {
        const doctorsResponse = await api.get("/doctors/");
        setDoctors(doctorsResponse.data.slice(0, 4));
      } catch (e) { console.warn("Failed to load doctors"); }
      
      // 2. Fetch Appointments & Stats
      try {
        const apptResponse = await api.get("/appointments/");
        const allAppts = apptResponse.data;
        
        setStats({
          total: allAppts.length,
          pending: allAppts.filter((a: any) => a.status === "pending").length,
          completed: allAppts.filter((a: any) => a.status === "completed").length,
        });

        // Find Next Appointment (Future only)
        const upcoming = allAppts
            .filter((a: any) => new Date(a.appointment_date) > new Date() && a.status !== 'cancelled')
            .sort((a: any, b: any) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
        
        setNextAppointment(upcoming[0] || null);
      } catch (err) {
        console.log("No appointments found");
      }

      // 3. 🔥 FETCH SMART TIP FROM BACKEND
      try {
        const tipResponse = await api.get("/tips/daily");
        setHealthTip(tipResponse.data);
      } catch (err) {
        // Fallback if backend tip fails
        setHealthTip({ 
            text: "Stay hydrated and healthy! Small steps lead to big changes.", 
            category: "General" 
        });
      }
      
    } catch (error: any) {
      console.error("Dashboard critical error:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

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
        
        {/* 1. HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {getGreeting()}, <span className="text-blue-600">{user?.fname || user?.name || "Patient"}</span>
            </h1>
            <p className="text-slate-500 mt-1">Here is your daily health overview.</p>
          </div>
          <div className="flex gap-2">
             <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
                <span className="text-2xl font-bold text-amber-500">{stats.pending}</span>
             </div>
             <div className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</span>
                <span className="text-2xl font-bold text-emerald-500">{stats.completed}</span>
             </div>
          </div>
        </div>

        {/* 2. HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: UP NEXT (Hero Card) */}
            <div className="lg:col-span-2">
                {nextAppointment ? (
                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group transition-all hover:shadow-2xl">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                            <div>
                                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-4 border border-white/10">
                                    UPCOMING APPOINTMENT
                                </span>
                                <h2 className="text-2xl md:text-3xl font-bold mb-2">Dr. {nextAppointment.doctor_name}</h2>
                                <div className="flex flex-wrap gap-4 text-blue-100">
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
                    <div className="h-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center items-start relative overflow-hidden min-h-[300px]">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Upcoming Visits</h2>
                            <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
                                You are all caught up! If you are feeling unwell or need a routine checkup, our doctors are here to help.
                            </p>
                            <button 
                                onClick={() => navigate('/patient/find-doctor')}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
                            >
                                <Stethoscope className="w-5 h-5" />
                                Find a Doctor
                            </button>
                        </div>
                        {/* Illustration Placeholder */}
                        <div className="absolute right-[-20px] bottom-[-40px] opacity-5">
                            <Stethoscope className="w-80 h-80 text-blue-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: SMART HEALTH TIP (Backend Powered) */}
            <div className="flex flex-col gap-6">
                <div className={`rounded-3xl p-6 border relative overflow-hidden transition-all duration-500 group h-full flex flex-col justify-center ${
                    healthTip?.category === "Morning" ? "bg-amber-50 border-amber-100 text-amber-900" :
                    healthTip?.category === "Evening" ? "bg-indigo-50 border-indigo-100 text-indigo-900" :
                    healthTip?.category === "Cardiology" ? "bg-rose-50 border-rose-100 text-rose-900" :
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
                            "{healthTip?.text || "Loading your daily health tip..."}"
                        </p>

                        <div className="text-xs font-semibold opacity-60">
                            — BukCare AI Companion
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. CATEGORIES SHORTCUTS */}
        <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Browse Specialists
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat.name}
                        onClick={() => navigate(`/patient/find-doctor?specialization=${encodeURIComponent(cat.specialization)}`)}
                        className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
                    >
                        <div className={`p-3 rounded-full mb-3 ${cat.color} group-hover:scale-110 transition-transform`}>
                            {cat.icon}
                        </div>
                        <span className="font-medium text-slate-700 text-sm">{cat.name}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* 4. TOP DOCTORS */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recommended Doctors</h3>
                <button onClick={() => navigate('/patient/find-doctor')} className="text-sm font-semibold text-blue-600 hover:underline">See All</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {doctors.map((doc) => (
                    <div key={doc.doctor_id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <img 
                                src={doc.avatar || "/default-avatar.png"} 
                                alt={doc.name}
                                className="w-14 h-14 rounded-full object-cover bg-slate-100 border border-slate-100"
                                onError={(e) => (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"} 
                            />
                            <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 truncate">Dr. {doc.name}</h4>
                                <p className="text-xs text-slate-500 truncate">{doc.specialization || "General"}</p>
                                <div className="flex items-center gap-1 mt-1 text-amber-400">
                                    <Star className="w-3 h-3 fill-current" />
                                    <span className="text-xs font-bold text-slate-700">4.9</span>
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
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;