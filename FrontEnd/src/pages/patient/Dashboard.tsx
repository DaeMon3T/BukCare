import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import MedicalIDCard from "@/components/MedicalIDCard";
import { useNotifications } from "@/hooks/useNotifications";

import {
  Activity,
  Calendar,
  Clock,
  Stethoscope,
  Brain,
  Baby,
  Eye,
  Bone,
  Heart,
  Star,
  CheckCircle2,
  QrCode,
  X,
  Search,
  Sparkles,
  ChevronRight,
  Bell,
  MapPin,
  User,
  Navigation,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── TYPES ───
interface Doctor {
  doctor_id: number;
  name: string;
  specialization?: string;
  specializations?: string[] | string;
  avatar?: string;
  consultation_fee?: number;
  average_rating?: number;
  total_reviews?: number;
}

interface Appointment {
  id: number;
  doctor_id?: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  specialization?: string;
  notes?: string | null;
  appointment_type?: "online" | "walk_in";
}

interface Hospital {
  place_id: string;
  name: string;
  vicinity: string;
  rating: number | null;
  total_ratings: number;
  photo_url: string | null;
  lat: number;
  lng: number;
  distance_km: number;
  open_now: boolean | null;
}

// ─── HELPERS ───
const getSpecialization = (data: any): string => {
  const specs = data?.specialization || data?.specializations;
  if (!specs) return "General Practice";
  if (Array.isArray(specs)) return specs.join(", ");
  if (typeof specs === "string") {
    try {
      if (specs.startsWith("[") && specs.endsWith("]")) {
        const parsed = JSON.parse(specs.replace(/'/g, '"'));
        if (Array.isArray(parsed)) return parsed.join(", ");
      }
    } catch (_e) { /* ignore */ }
    return specs.replace(/[\[\]"']/g, "");
  }
  return String(specs);
};

const categories = [
  { name: "Dentist", icon: Activity, specialization: "Dentistry" },
  { name: "Cardiology", icon: Heart, specialization: "Cardiology" },
  { name: "Orthopedics", icon: Bone, specialization: "Orthopedics" },
  { name: "Neurology", icon: Brain, specialization: "Neurology" },
  { name: "General", icon: Stethoscope, specialization: "General Practice" },
  { name: "Pediatrics", icon: Baby, specialization: "Pediatrics" },
  { name: "Eye Care", icon: Eye, specialization: "Ophthalmology" },
];

// ─── COMPONENT ───
const PatientDashboard = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const navigate = useNavigate();
  
  const { notifications } = useNotifications(user?.id ? Number(user.id) : undefined);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [showMedicalID, setShowMedicalID] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [recentNotes, setRecentNotes] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("Stay hydrated and take small steps towards better health today.");
  const [insightCategory, setInsightCategory] = useState("Daily Wellness");
  const [insightDoctor, setInsightDoctor] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Nearby hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [locationName, setLocationName] = useState("Locating...");

  // ─── DATA FETCHING ───
  const fetchDashboardData = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [doctorsRes, apptRes, tipRes] = await Promise.allSettled([
        api.get("/doctors/?approved=true"),
        api.get("/appointments/"),
        api.get("/tips/daily"),
      ]);

      let fetchedDoctors: Doctor[] = [];
      if (doctorsRes.status === "fulfilled") {
        fetchedDoctors = doctorsRes.value.data;
        setAllDoctors(fetchedDoctors);
        setDoctors(fetchedDoctors.slice(0, 6));
      }
      if (tipRes.status === "fulfilled" && tipRes.value.data) {
        setAiInsight(tipRes.value.data.text);
        if (tipRes.value.data.category) setInsightCategory(tipRes.value.data.category);
        if (tipRes.value.data.doctor_name) setInsightDoctor(tipRes.value.data.doctor_name);
      }
      if (apptRes.status === "fulfilled") {
        const allAppts: Appointment[] = apptRes.value.data;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const upcoming = allAppts.filter(
          (a) => new Date(a.appointment_date) >= startOfToday && a.status !== "cancelled" && a.status !== "completed"
        );
        const sorted = upcoming.sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
        const nextAppt = sorted[0] || null;
        if (nextAppt) {
          const matchedDoctor = fetchedDoctors.find((d) => d.doctor_id === nextAppt.doctor_id || d.name === nextAppt.doctor_name);
          const rawSpec = matchedDoctor ? matchedDoctor.specialization || matchedDoctor.specializations : nextAppt.specialization;
          setNextAppointment({ ...nextAppt, specialization: getSpecialization({ specialization: rawSpec }) });
        } else {
          setNextAppointment(null);
        }
        const completedWithNotes = allAppts
          .filter((a) => a.status === "completed" && a.notes)
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
          .slice(0, 3);
        setRecentNotes(completedWithNotes);
      }
    } catch (error: any) {
      console.error("Dashboard error:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // ─── NEARBY HOSPITALS ───
  const fetchNearbyHospitals = useCallback(async (lat: number, lng: number) => {
    setHospitalsLoading(true);
    try {
      const res = await api.get(`/hospitals/nearby?lat=${lat}&lng=${lng}`);
      setHospitals(res.data.slice(0, 8));
    } catch (err) {
      console.error("Nearby hospitals error:", err);
    } finally {
      setHospitalsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const addr = data.address;
      const city = addr.city || addr.town || addr.municipality || addr.county || addr.state || "";
      const country = addr.country || "";
      setLocationName(city ? `${city}, ${country}` : country || "Your Location");
    } catch {
      setLocationName("Your Location");
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchNearbyHospitals(latitude, longitude);
          reverseGeocode(latitude, longitude);
        },
        () => {
          setLocationName("Location unavailable");
        }
      );
    }
  }, [fetchNearbyHospitals, reverseGeocode]);

  useEffect(() => {
    if (lastMessage && (lastMessage.type === "APPOINTMENT_UPDATE" || lastMessage.type === "NEW_APPOINTMENT")) {
      fetchDashboardData(true);
      if (lastMessage.status === "confirmed") toast.success("Your appointment was confirmed!");
      else if (lastMessage.status === "completed") toast.success("Appointment marked as completed.");
    }
  }, [lastMessage, fetchDashboardData]);

  // ─── UTILITIES ───
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });


  const formatTimeRange = (dateStr: string) => {
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  // ─── LOADING ───
  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  
  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Medical ID Modal */}
      {showMedicalID && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowMedicalID(false)} />
          <div className="relative z-10">
            <button
              onClick={() => setShowMedicalID(false)}
              className="absolute -top-4 -right-4 bg-white text-slate-700 p-2 rounded-full shadow-lg hover:text-red-600 transition-all z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <MedicalIDCard />
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE TOP BAR ─── */}
      <div className="md:hidden sticky top-0 z-30 bg-white px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-800">{locationName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMedicalID(true)}
              className="w-9 h-9 bg-white hover:bg-slate-50 transition-colors border border-slate-100 rounded-full flex items-center justify-center shadow-sm"
              title="Show Medical ID"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
            </button>
            <button 
              onClick={() => {
                if (unreadCount > 0) {
                  toast(`You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`);
                } else {
                  toast("No new notifications");
                }
              }}
              className="w-9 h-9 bg-white hover:bg-slate-50 active:scale-95 transition-all border border-slate-100 rounded-full flex items-center justify-center shadow-sm relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 lg:px-8 py-4 md:py-8 space-y-6 pb-28 md:pb-8">

        {/* ─── DESKTOP HEADER ─── */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-500 font-medium">{locationName}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {getGreeting()},{" "}
              <span className="text-blue-600">{user?.fname || "Patient"}</span>
            </h1>
          </div>
          <button
            onClick={() => setShowMedicalID(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl font-semibold text-sm hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            My Medical ID
          </button>
        </div>

        {/* ─── SEARCH BAR ─── */}
        <div className="relative z-20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="Search doctor, specialist..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setShowDropdown(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showDropdown && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
              {(() => {
                const results = allDoctors.filter(doc => {
                  const q = searchQuery.toLowerCase();
                  return (
                    doc.name.toLowerCase().includes(q) ||
                    getSpecialization(doc).toLowerCase().includes(q)
                  );
                }).slice(0, 5);

                return results.length > 0 ? (
                  results.map(doc => (
                    <button
                      key={doc.doctor_id}
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent onBlur from firing before click
                        navigate(`/patient/doctor/${doc.doctor_id}`);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-left transition-colors"
                    >
                      <img
                        src={doc.avatar || "/default-avatar.png"}
                        alt={doc.name}
                        className="w-10 h-10 rounded-full object-cover bg-slate-100"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/default-avatar.png")}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">Dr. {doc.name}</p>
                        <p className="text-xs text-blue-500 font-medium truncate">{getSpecialization(doc)}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-slate-500 text-sm">
                    No doctors found matching "{searchQuery}"
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ─── UPCOMING SCHEDULE ─── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Upcoming Schedule
              {nextAppointment && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full align-middle">
                  1
                </span>
              )}
            </h3>
            <button
              onClick={() => navigate("/patient/appointments")}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600"
            >
              See All
            </button>
          </div>

          {nextAppointment ? (
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg hover:shadow-blue-200 transition-all"
              onClick={() => navigate("/patient/appointments")}
            >
              <div className="flex items-center gap-4 mb-4">
                {/* Circular avatar with blue ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full border-[3px] border-white/50 overflow-hidden bg-blue-400 flex items-center justify-center">
                    {allDoctors.find(d => d.doctor_id === nextAppointment.doctor_id || d.name === nextAppointment.doctor_name)?.avatar ? (
                      <img 
                        src={allDoctors.find(d => d.doctor_id === nextAppointment.doctor_id || d.name === nextAppointment.doctor_name)?.avatar} 
                        alt={nextAppointment.doctor_name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-7 h-7 text-white/80" />
                    )}
                  </div>
                  {nextAppointment.status === "confirmed" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 border-2 border-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-lg leading-tight truncate">
                    Dr. {nextAppointment.doctor_name}
                  </h4>
                  <p className="text-blue-100 text-sm font-medium truncate">
                    {nextAppointment.specialization || "Medical Specialist"}
                  </p>
                </div>

                <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${nextAppointment.status === "confirmed"
                  ? "bg-emerald-400/30 text-emerald-100"
                  : "bg-amber-400/30 text-amber-100"
                  }`}>
                  {nextAppointment.status === "confirmed" ? "Confirmed" : "Pending"}
                </span>
              </div>

              {/* Date & Time pills */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3.5 py-2 rounded-xl">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-semibold">{formatDate(nextAppointment.appointment_date)}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3.5 py-2 rounded-xl">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-sm font-semibold">{formatTimeRange(nextAppointment.appointment_date)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700">No Upcoming Visits</p>
                  <p className="text-slate-400 text-sm">Ready for a check-up?</p>
                </div>
                <button
                  onClick={() => navigate("/patient/find-doctor")}
                  className="flex-shrink-0 bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-600 transition-all"
                >
                  Book Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── DOCTOR SPECIALITY ─── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900">Doctor Speciality</h3>
            <button
              onClick={() => navigate("/patient/find-doctor")}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600"
            >
              See All
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 pb-3 -mx-5 px-5 scrollbar-hide snap-x">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/patient/find-doctor?specialization=${encodeURIComponent(cat.specialization)}`)}
                className="flex flex-col items-center gap-2 group snap-center sm:snap-start flex-shrink-0 w-16"
              >
                <div className={`w-14 h-14 rounded-full bg-blue-50/80 flex items-center justify-center text-blue-600 group-hover:bg-blue-100/80 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all`}>
                  <cat.icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── NEARBY HOSPITALS ─── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-900">Nearby Hospitals</h3>
            <button 
                onClick={() => navigate("/patient/locator")}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600"
            >
              See All
            </button>
          </div>

          {hospitalsLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="min-w-[200px] flex-shrink-0 animate-pulse">
                  <div className="h-32 bg-slate-100 rounded-2xl mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
              <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">Enable location to see nearby hospitals</p>
              <p className="text-xs text-slate-400 mt-1">Allow location access in your browser settings</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-5 px-5 scrollbar-hide snap-x">
              {hospitals.map((h) => (
                <div key={h.place_id} className="min-w-[200px] snap-start flex-shrink-0">
                  <div className="relative">
                    {h.photo_url ? (
                      <img
                        src={h.photo_url}
                        alt={h.name}
                        className="w-full h-32 object-cover rounded-2xl bg-slate-100"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          (e.currentTarget.nextSibling as HTMLElement)!.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-32 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 items-center justify-center ${h.photo_url ? "hidden" : "flex"}`}
                    >
                      <MapPin className="w-8 h-8 text-blue-300" />
                    </div>

                    {/* Rating badge */}
                    {h.rating && (
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-slate-700">{h.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 px-0.5">
                    <p className="font-bold text-sm text-slate-900 truncate">{h.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Navigation className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {h.distance_km < 1 ? `${Math.round(h.distance_km * 1000)}m away` : `${h.distance_km}km away`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── AI HEALTH TIP ─── */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-5 relative overflow-hidden transition-all duration-500">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">{insightCategory}</span>
                {insightDoctor && (
                  <span className="text-[10px] font-semibold bg-white/15 border border-white/20 text-white/80 px-2 py-0.5 rounded-full">
                    Dr. {insightDoctor}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white leading-relaxed">"{aiInsight}"</p>
            </div>
          </div>
        </div>

        {/* ─── SPECIALIST DOCTORS ─── */}
        {doctors.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Recommended Doctors</h3>
              <button
                onClick={() => navigate("/patient/find-doctor")}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600"
              >
                See All
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-3 -mx-5 px-5 scrollbar-hide snap-x">
              {doctors.map((doc) => (
                <div key={doc.doctor_id} className="w-[calc(100vw-40px)] sm:w-[350px] md:w-[400px] snap-center sm:snap-start flex-shrink-0">
                  <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all h-full flex flex-col">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="w-[84px] h-[92px] flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative">
                        <img
                          src={doc.avatar || "/default-avatar.png"}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/default-avatar.png")}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 pt-0.5 pl-5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 fill-blue-600/20" />
                          <span className="text-[11px] font-bold text-blue-600">Professional Doctor</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm truncate mb-0.5">Dr. {doc.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate mb-2">{getSpecialization(doc)}</p>

                        {/* Rating */}
                        <div className="flex items-center flex-wrap gap-y-1 mb-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const rating = doc.average_rating || 0;
                              const isFilled = star <= Math.round(rating);
                              return (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${isFilled ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex items-center mt-0.5">
                            <span className="text-[11px] font-bold text-slate-700 ml-1.5">{doc.average_rating ? doc.average_rating.toFixed(1) : "0.0"}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({doc.total_reviews || 0} Reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1" /> {/* Spacer to push button to bottom if heights vary */}
                    <button
                      onClick={() => navigate(`/patient/book/${doc.doctor_id}`)}
                      className="w-full mt-4 py-3 bg-blue-50/80 text-blue-600 text-sm font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all border border-transparent hover:border-blue-600"
                    >
                      Make Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── CONSULTATION NOTES ─── */}
        {recentNotes.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-900">Consultation Notes</h3>
              <button
                onClick={() => navigate("/patient/appointments")}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600"
              >
                See All
              </button>
            </div>
            <div className="space-y-2.5">
              {recentNotes.map((appt) => (
                <div key={appt.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-slate-900">Dr. {appt.doctor_name}</p>
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-white px-2 py-1 rounded-lg border border-slate-100">
                      {formatDate(appt.appointment_date)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{appt.notes}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientDashboard;