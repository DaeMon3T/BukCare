import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
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
  Pill,
  ArrowRight,
  Star,
  MapPin,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

interface Doctor {
  doctor_id: number;
  user_id?: number;
  name: string;
  email: string;
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

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Category data with icons
  const categories = [
    { name: "General", icon: <Stethoscope className="w-6 h-6" />, color: "from-blue-500 to-cyan-500", specialization: "General Practice" },
    { name: "Cardiology", icon: <Heart className="w-6 h-6" />, color: "from-red-500 to-pink-500", specialization: "Cardiology" },
    { name: "Dermatology", icon: <Activity className="w-6 h-6" />, color: "from-orange-500 to-amber-500", specialization: "Dermatology" },
    { name: "Neurology", icon: <Brain className="w-6 h-6" />, color: "from-purple-500 to-indigo-500", specialization: "Neurology" },
    { name: "Pediatrics", icon: <Baby className="w-6 h-6" />, color: "from-pink-500 to-rose-500", specialization: "Pediatrics" },
    { name: "Ophthalmology", icon: <Eye className="w-6 h-6" />, color: "from-teal-500 to-emerald-500", specialization: "Ophthalmology" },
    { name: "Orthopedics", icon: <Bone className="w-6 h-6" />, color: "from-slate-500 to-gray-500", specialization: "Orthopedics" },
    { name: "Pharmacy", icon: <Pill className="w-6 h-6" />, color: "from-green-500 to-lime-500", specialization: "Pharmacy" },
  ];

  // Quick actions data
  const quickActions = [
    {
      title: "Book Appointment",
      description: "Schedule a new visit",
      icon: <Calendar className="w-8 h-8 mb-3" />,
      gradient: "from-blue-500 to-cyan-500",
      onClick: () => navigate("/patient/book-appointment")
    },
    {
      title: "My Appointments",
      description: "View all appointments",
      icon: <Clock className="w-8 h-8 mb-3" />,
      gradient: "from-purple-500 to-indigo-500",
      onClick: () => navigate("/patient/appointments")
    },
    {
      title: "Medical History",
      description: "Past appointments",
      icon: <Activity className="w-8 h-8 mb-3" />,
      gradient: "from-green-500 to-emerald-500",
      onClick: () => navigate("/patient/appointment-history")
    },
    {
      title: "Find Doctor",
      description: "Search specialists",
      icon: <Stethoscope className="w-8 h-8 mb-3" />,
      gradient: "from-orange-500 to-amber-500",
      onClick: () => navigate("/patient/find-doctor")
    },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch doctors (using the same endpoint as FindDoctor page)
      const doctorsResponse = await api.get("/doctors/");
      setDoctors(doctorsResponse.data.slice(0, 6)); // Show top 6 doctors
      
      // Fetch upcoming appointments
      try {
        const appointmentsResponse = await api.get("/appointments/upcoming");
        setUpcomingAppointments(appointmentsResponse.data.slice(0, 3)); // Show next 3
      } catch (err) {
        console.log("No upcoming appointments endpoint or no data");
        setUpcomingAppointments([]);
      }
      
      // Fetch all appointments for stats
      try {
        const allAppointmentsResponse = await api.get("/appointments/");
        const allAppointments = allAppointmentsResponse.data;
        
        setStats({
          total: allAppointments.length,
          upcoming: allAppointments.filter((a: any) => 
            a.status === "pending" || a.status === "confirmed"
          ).length,
          completed: allAppointments.filter((a: any) => 
            a.status === "completed"
          ).length,
        });
      } catch (err) {
        console.log("No appointments found");
        setStats({ total: 0, upcoming: 0, completed: 0 });
      }
      
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      // Don't show error toast if it's just missing data
      if (error?.response?.status !== 404) {
        toast.error("Failed to load some dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (specialization: string) => {
    navigate(`/patient/find-doctor?specialization=${encodeURIComponent(specialization)}`);
  };

  const handleBookAppointment = (doctorId: number) => {
    navigate(`/patient/book-appointment?doctor_id=${doctorId}`);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Greeting Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {getGreeting()}, {user?.fname || user?.name || "Guest"}
            </h1>
            <p className="text-slate-600 mt-1">How can we help you today?</p>
          </div>
          
          {/* Quick Stats - Industrial Modern */}
          <div className="flex gap-3">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-start gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.upcoming}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -translate-y-8 translate-x-8 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative flex items-start gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Completed</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section - Horizontal scroll on mobile */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Categories</h2>
            <button 
              onClick={() => navigate("/patient/find-doctor")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Horizontal scrollable container */}
          <div className="relative -mx-4 sm:mx-0">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 sm:px-0">
              <div className="flex gap-3 sm:grid sm:grid-cols-4 lg:grid-cols-8 pb-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.specialization)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all hover:scale-105 flex flex-col items-center gap-2 group flex-shrink-0 w-24 sm:w-auto"
                  >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                      {category.icon}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 text-center whitespace-nowrap">{category.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Upcoming Appointments</h2>
              <button 
                onClick={() => navigate("/patient/appointments")}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingAppointments.map((appointment) => {
                const { date, time } = formatDateTime(appointment.appointment_date);
                return (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate("/patient/appointments")}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{appointment.doctor_name}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {appointment.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Our Doctors Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">Our Doctors</h2>
            <button 
              onClick={() => navigate("/patient/find-doctor")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.doctor_id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white flex-shrink-0">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 truncate">Dr. {doctor.name}</p>
                      {doctor.is_verified && (
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate">{doctor.specialization || "General Practice"}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">4.8</span>
                      <span className="text-xs text-slate-500">(120 reviews)</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {doctor.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{doctor.address}</span>
                    </div>
                  )}
                  {doctor.years_of_experience && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span>{doctor.years_of_experience} years experience</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleBookAppointment(doctor.doctor_id)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - Horizontal scroll on mobile */}
        <div className="relative -mx-4 sm:mx-0">
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-4 sm:px-0">
            <div className="flex gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 pb-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`bg-gradient-to-br ${action.gradient} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-left flex-shrink-0 w-64 sm:w-auto`}
                >
                  {action.icon}
                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;