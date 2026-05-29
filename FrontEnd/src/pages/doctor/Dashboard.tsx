import { useState, useEffect, useRef } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
  Plus,
  QrCode,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Navbar from "@/components/Navbar";
import api from "@/services/api";
import appointmentpic from "@/assets/images/appointment.png";
import pendingpic from "@/assets/images/pending.png";
import confirmedpic from "@/assets/images/confirmed.png";
import patientpic from "@/assets/images/patient.png";
import history from "@/assets/images/history.png";
import bukcarelogo from "@/assets/images/bukcare_logo.png";
import clockpic from "@/assets/images/clock.png";
import completepic from "@/assets/images/complete.png";
import cancelpic from "@/assets/images/cancel.png";

// Appointment type definition
interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_avatar?: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Dashboard Statistics
interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

interface Schedule {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes?: string;
}

const CHART_COLORS = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  completed: "#3B82F6",
  cancelled: "#EF4444",
};


const toDateString = (dateInput: string | Date): string => {
    const d = new Date(dateInput);
    // Use local year/month/day to match user's perspective (Philippines Time)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const DoctorDashboard: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = (user?.role || "") === "staff";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch appointments and schedules
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const appointmentsRes = await api.get<Appointment[]>("/appointments/doctor");
      setAppointments(appointmentsRes.data);
      calculateStats(appointmentsRes.data);

      // Only doctors can fetch schedules — staff gets 403
      if (!isStaff) {
        try {
          const schedulesRes = await api.get<Schedule[]>("/schedules");
          setSchedules(schedulesRes.data);
        } catch {
          console.warn("Could not load schedules (staff user).");
        }
      }
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const [weekOverWeek, setWeekOverWeek] = useState({ thisWeek: 0, lastWeek: 0, growth: 0 });

  const calculateStats = (appointmentsData: Appointment[]) => {
    const todayStr = toDateString(new Date());

    const stats: DashboardStats = {
      totalAppointments: appointmentsData.length,
      todayAppointments: appointmentsData.filter((apt) => {
        const aptDateStr = apt.appointment_date.split('T')[0] ?? "";
        return aptDateStr === todayStr && apt.status !== 'cancelled';
      }).length,
      upcomingAppointments: appointmentsData.filter((apt) => {
        const aptDateStr = apt.appointment_date.split('T')[0] ?? "";
        return aptDateStr > todayStr && apt.status !== "cancelled";
      }).length,
      pendingAppointments: appointmentsData.filter((apt) => apt.status === "pending").length,
      confirmedAppointments: appointmentsData.filter((apt) => apt.status === "confirmed").length,
      completedAppointments: appointmentsData.filter((apt) => apt.status === "completed").length,
      cancelledAppointments: appointmentsData.filter((apt) => apt.status === "cancelled").length,
    };

    // Week-over-week calculation
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeekCount = appointmentsData.filter((a) => {
      const d = new Date(a.appointment_date);
      return d >= thisWeekStart && d < now;
    }).length;
    const lastWeekCount = appointmentsData.filter((a) => {
      const d = new Date(a.appointment_date);
      return d >= lastWeekStart && d < thisWeekStart;
    }).length;
    const growth = lastWeekCount === 0
      ? (thisWeekCount > 0 ? 100 : 0)
      : Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);

    setWeekOverWeek({ thisWeek: thisWeekCount, lastWeek: lastWeekCount, growth });
    setStats(stats);
  };

  // Mag buhat ug ref para sa appointments list aron ma handle nato ang auto-scroll sa new appointments
  const appointmentsListRef = useRef<HTMLDivElement>(null);

  const getWeeklyTrendData = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); 
    
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      // Define the end of the day for comparison
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Filter appointments that fall on this specific day
      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= date && aptDate < nextDate;
      });
      
      weekData.push({
        name: date.toLocaleDateString("en-US", { weekday: "short" }), // "Sun", "Mon", etc.
        pending: dayAppointments.filter(a => a.status === "pending").length,
        confirmed: dayAppointments.filter(a => a.status === "confirmed").length,
        completed: dayAppointments.filter(a => a.status === "completed").length,
      });
    }
    
    return weekData;
  };

  // Generate pie chart data from stats
  const getStatusDistributionData = () => {
    return [
      { name: "Pending", value: stats.pendingAppointments, color: CHART_COLORS.pending },
      { name: "Confirmed", value: stats.confirmedAppointments, color: CHART_COLORS.confirmed },
      { name: "Completed", value: stats.completedAppointments, color: CHART_COLORS.completed },
      { name: "Cancelled", value: stats.cancelledAppointments, color: CHART_COLORS.cancelled },
    ].filter(item => item.value > 0);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "pending":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "cancelled":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "completed":
        return "text-blue-700 bg-blue-50 border-blue-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const aptDate = new Date(date);
    aptDate.setHours(0, 0, 0, 0);

    if (aptDate.getTime() === today.getTime()) {
      return "Today";
    } else if (aptDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = appointments;

    if (activeTab === "today") {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= tomorrow && apt.status !== "cancelled";
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((apt) =>
        apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { 
        status: newStatus 
      });
      toast.success(`Appointment ${newStatus}`);
      fetchData();
      setShowAppointmentDetails(false);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update appointment status");
    }
  };
  // Initialize with today's date
const [selectedDate, setSelectedDate] = useState(new Date());

// Helper to format date to YYYY-MM-DD for comparison with your DB data
// const formatDateKey = (date: Date) => {
//     return date.toISOString().split('T')[0];
// };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getSchedulesForDate = (date: Date) => {
  const dateStr = toDateString(date); // : Uses your new helper
  return schedules.filter((sch) => sch.date === dateStr && sch.is_available);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    
    // Empty cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 bg-slate-50/50"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      
      // Use toDateString for consistent local string comparison
      const dateStr = toDateString(date);
      const isToday = dateStr === toDateString(today);
      const isSelected = dateStr === toDateString(selectedDate);

      const dayAppointments = getAppointmentsForDate(date);
      const daySchedules = getSchedulesForDate(date);
      const hasEvents = dayAppointments.length > 0 || daySchedules.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`
            h-14 border border-slate-100 p-1 text-sm transition-all cursor-pointer relative group
            ${isSelected 
                ? "bg-[#00aeef] border-[#00aeef] text-white shadow-md rounded-lg scale-105 z-10" 
                : isToday 
                    ? "bg-blue-50 border-blue-300" 
                    : "hover:bg-slate-50 bg-white" 
            }
          `}
        >
          <div className={`font-medium flex justify-between items-start ${
              isSelected ? "text-white" : isToday ? "text-blue-600" : "text-slate-700"
          }`}>
            {day}
          </div>

          {/* Event Dots */}
          {hasEvents && (
            <div className="flex gap-1 mt-1 absolute bottom-1.5 right-1.5">
              {dayAppointments.length > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}></div>
              )}
              {daySchedules.length > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-200" : "bg-emerald-500"}`}></div>
              )}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Appointment Details Modal
  const AppointmentDetailsModal: FC = () =>
  selectedAppointment ? (
    // 1. Overlay: Added z-[9999] to ensure it sits on top of everything
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-6 animate-in fade-in duration-300">
      
      {/* 2. Modal Card: Used 'flex flex-col' and 'max-h' so it adapts to screen height */}
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg md:max-w-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[95vh] overflow-hidden transform animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* --- HEADER (Fixed) --- */}
        <div className="relative bg-gradient-to-r from-blue-700 to-[#2dc7f8] p-4 sm:p-5 flex-none z-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}}></div>
          </div>
          <div className="relative z-10 flex justify-between items-start gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon: Hidden on very small screens to save space */}
              <div className="hidden xs:flex w-12 h-12 sm:w-16 sm:h-16 bg-white backdrop-blur-lg rounded-xl sm:rounded-2xl items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
                <img src={bukcarelogo} alt="Appointment" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1 tracking-tight">
                  Appointment Details
                </h2>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">Complete information view</p>
              </div>
            </div>
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
            >
              <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        </div>

        {/* --- SCROLLABLE CONTENT (Flex-1) --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 bg-slate-50/50">
          
          {/* Patient Info Card */}
          <div className="relative bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div className="relative flex-shrink-0">
              
              {/* Check if avatar exists, otherwise show initials */}
              {selectedAppointment.patient_avatar ? (
                <img 
                  src={selectedAppointment.patient_avatar} 
                  alt={selectedAppointment.patient_name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg border-4 border-white">
                  {selectedAppointment.patient_name.split(' ').map(n => n[0]).join('')}
                </div>
              )}

              {/* Status Dot */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate leading-tight">
                {selectedAppointment.patient_name}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold font-mono">
                  ID: {selectedAppointment.patient_id}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid (Stacks on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Date */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                <img src={appointmentpic} alt="Date" className="w-6 h-6 object-contain"/>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                <p className="font-bold text-slate-900">{formatDate(selectedAppointment.appointment_date)}</p>
              </div>
            </div>

            {/* Time */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                <img src={pendingpic} alt="Time" className="w-6 h-6 object-contain"/>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Time</p>
                <p className="font-bold text-slate-900">{formatTime(selectedAppointment.appointment_date)}</p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                <img src={confirmedpic} alt="Status" className="w-6 h-6 object-contain"/>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold capitalize mt-0.5 border ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          <div className="space-y-3">
            {selectedAppointment.reason && (
              <div className="bg-blue-50/50 p-4 sm:p-5 rounded-xl border border-blue-100">
                <h4 className="text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-2">
                  <img src={history} className="w-4 h-4" alt="Reason"/> Reason
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{selectedAppointment.reason}</p>
              </div>
            )}
            {selectedAppointment.notes && (
              <div className="bg-purple-50/50 p-4 sm:p-5 rounded-xl border border-purple-100">
                <h4 className="text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-2">
                  <span className="w-4 h-4 bg-purple-200 rounded-full flex items-center justify-center text-[10px]">📝</span> Notes
                </h4>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* --- FOOTER ACTIONS (Fixed at bottom) --- */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex-none z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            {!isStaff && selectedAppointment.status === "pending" && (
              <>
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed")}
                  className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Confirm
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled")}
                  className="flex-1 py-3.5 px-4 bg-white border-2 border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <XCircle className="w-5 h-5" /> Cancel
                </button>
              </>
            )}
            {!isStaff && selectedAppointment.status === "confirmed" && new Date(selectedAppointment.appointment_date) <= new Date() && (
              <button
                onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle className="w-5 h-5" /> Mark as Completed
              </button>
            )}
            {!isStaff && selectedAppointment.status === "confirmed" && new Date(selectedAppointment.appointment_date) > new Date() && (
              <p className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full px-4">
                Completion will be available after the scheduled time: <span className="font-bold text-slate-500">{new Date(selectedAppointment.appointment_date).toLocaleString()}</span>
              </p>
            )}
            {isStaff && (
              <p className="text-center text-sm text-slate-400 py-2 w-full">
                You have view-only access. Contact a doctor to update appointments.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredAppointments = filterAppointments();
  const weeklyTrendData = getWeeklyTrendData();
  const statusDistributionData = getStatusDistributionData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className=" inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                  data-tour="doc-scan"
                  onClick={() => isStaff ? navigate('/staff/scan') : navigate('/doctor/scan')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm sm:text-base"
              >
                  <QrCode className="w-5 h-5" />
                  <span>Scan Patient ID</span>
              </button>
              
              {!isStaff && (
                <button 
                  onClick={() => navigate('/doctor/set-availability')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Schedule</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        {/* CHANGED: grid-cols-2 on mobile instead of 1 to fit side-by-side */}
        <div data-tour="doc-stats" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 mb-5">
          
          {/* TODAY'S APPOINTMENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  {/* Smaller icon on mobile */}
                  <img src={appointmentpic} alt="Icon" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
                {/* Hidden on mobile to save space */}
                <div className="hidden sm:flex w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              
              {/* Smaller text labels */}
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">
                Today
              </p>
              
              {/* Drastically smaller number font on mobile */}
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight mb-0 sm:mb-3">
                {stats.todayAppointments}
              </p>

              {/* Hide progress bar and capacity text on mobile to keep it compact */}
              <div className="hidden sm:block mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.todayAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.todayAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* PENDING */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={pendingpic} alt="Pending" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
                <div className="hidden sm:block w-3 h-3 bg-slate-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">
                Pending
              </p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight mb-0 sm:mb-3">
                {stats.pendingAppointments}
              </p>
              
              <div className="hidden sm:block mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.pendingAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.pendingAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* CONFIRMED */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={confirmedpic} alt="Confirmed" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
                <div className="hidden sm:flex w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                  <CheckCircle className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">
                Confirmed
              </p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight mb-0 sm:mb-3">
                {stats.confirmedAppointments}
              </p>
              
              <div className="hidden sm:block mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.confirmedAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.confirmedAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* TOTAL APPOINTMENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={patientpic} alt="Total" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
                <div className="hidden sm:flex w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                  <span className="text-xs font-bold text-slate-700">All</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">
                Total
              </p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight mb-0 sm:mb-3">
                {stats.totalAppointments}
              </p>
              
              <div className="hidden sm:block mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: '100%' }}
                />
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-2 font-medium">
                Complete overview
              </p>
            </div>
          </div>

          {/* Overview Stats - Make this span full width on mobile or 2 columns if you prefer */}
            <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4">
              <h3 className="text-sm sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-6 flex items-center">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                Overview
              </h3>
              <div className="space-y-2 sm:space-y-4">
                {[
                  { label: "Pending", value: stats.pendingAppointments, img: pendingpic, textColor: "text-blue-600" },
                  { label: "Confirmed", value: stats.confirmedAppointments, img: confirmedpic, textColor: "text-blue-600" },
                  { label: "Completed", value: stats.completedAppointments, img: completepic, textColor: "text-blue-600" },
                  { label: "Cancelled", value: stats.cancelledAppointments, img: cancelpic, textColor: "text-blue-600" },
                ].map((stat, _index) => (
                  <div key={stat.label} className="flex items-center justify-between py-1 sm:py-2">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div>
                        <img
                          src={stat.img} alt={stat.label} className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                        />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-700">{stat.label}</span>
                    </div>
                    <span className={`text-xs sm:text-base font-bold ${stat.textColor}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        </div>


        {/* Week-over-Week Summary */}
        <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
          <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-slate-700">Week-over-Week:</span>
          <span className="text-sm text-slate-600">
            This week <span className="font-bold text-slate-900">{weekOverWeek.thisWeek}</span> appts
            {" vs "} last week <span className="font-bold text-slate-900">{weekOverWeek.lastWeek}</span>
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
            weekOverWeek.growth > 0
              ? "bg-emerald-100 text-emerald-700"
              : weekOverWeek.growth < 0
              ? "bg-rose-100 text-rose-700"
              : "bg-slate-100 text-slate-600"
          }`}>
            {weekOverWeek.growth > 0 ? "▲" : weekOverWeek.growth < 0 ? "▼" : "—"}
            {" "}{Math.abs(weekOverWeek.growth)}%{" "}
            {weekOverWeek.growth > 0 ? "increase" : weekOverWeek.growth < 0 ? "decrease" : "no change"}
          </span>
        </div>

        {/* Charts and Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Weekly Trends Chart */}
              <div data-tour="doc-charts" className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 p-4 sm:p-6 relative overflow-hidden">
                {/* Subtle decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  {/* Header: Kept Original Layout (Left Aligned) */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Weekly Trends</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Appointment overview</p>
                    </div>
                  </div>

                  {/* Legend: Kept Original Layout (Left Aligned) */}
                  <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-gradient-to-br from-amber-400 to-orange-500"></span>
                      <span className="text-slate-700 font-medium">Pending</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-gradient-to-br from-blue-500 to-cyan-500"></span>
                      <span className="text-slate-700 font-medium">Confirmed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-gradient-to-br from-emerald-500 to-teal-500"></span>
                      <span className="text-slate-700 font-medium">Completed</span>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="w-full h-[250px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                          data={weeklyTrendData} 
                          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0.7} />
                          </linearGradient>
                          <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
                          </linearGradient>
                          <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="#0e0e0f" 
                          vertical={false} 
                          strokeOpacity={1}
                        />
                        <XAxis 
                          dataKey="name" 
                          stroke="#0e0e0f" 
                          fontSize={12}
                          tick={{ fill: '#0e0e0f' }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#0e0e0f" 
                          fontSize={12}
                          tick={{ fill: '#0e0e0f' }}
                          tickLine={false}
                          axisLine={false}
                          domain={[0, 10]}
                          ticks={[0, 2, 4, 6, 8, 10]}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(14, 14, 15, 0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                            padding: '12px',
                            color: 'white'
                          }}
                          labelStyle={{ 
                            color: 'white', 
                            fontWeight: 600,
                            marginBottom: '8px'
                          }}
                          itemStyle={{ 
                            color: 'white',
                            fontSize: '13px',
                            padding: '2px 0'
                          }}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.1)', radius: 4 }}
                        />
                        <Bar 
                          dataKey="pending" 
                          fill="url(#pendingGradient)" 
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          barSize={12}
                        />
                        <Bar 
                          dataKey="confirmed" 
                          fill="url(#confirmedGradient)" 
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          barSize={12}
                        />
                        <Bar 
                          dataKey="completed" 
                          fill="url(#completedGradient)" 
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                          barSize={12}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>


              

              {/* Status Distribution Chart */}
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 p-6 relative overflow-hidden">
                {/* Subtle decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Appointment Status</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Distribution overview</p>
                    </div>
                    <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200 hover:shadow-md">
                      <MoreVertical className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                  {statusDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <defs>
                          {/* Gradients for each status */}
                          <linearGradient id="pendingPieGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#662f07ff" />
                          </linearGradient>
                          <linearGradient id="confirmedPieGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#05424dff" />
                          </linearGradient>
                          <linearGradient id="completedPieGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#08655bff" />
                          </linearGradient>
                          <linearGradient id="cancelledPieGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#580606ff" />
                          </linearGradient>
                          <filter id="pieShadow">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                          </filter>
                        </defs>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                          style={{ filter: 'url(#pieShadow)' }}
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              stroke="white"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                            padding: '12px',
                            color: 'white'
                          }}
                          itemStyle={{ 
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ paddingTop: '16px' }}
                          formatter={(value) => <span className="text-sm text-slate-700 font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">No appointment data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            

            {/* Appointments List */}
            <div
              ref={appointmentsListRef}
              data-tour="doc-appointments-list"
              className="bg-white rounded-2xl shadow-sm border border-slate-200"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-slate-900">Appointments</h2>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab("today")}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === "today"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === "upcoming"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === "all"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No {activeTab} appointments</p>
                    <p className="text-sm mt-1">
                      {searchTerm ? "Try adjusting your search" : "Your schedule is clear"}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all duration-300 group cursor-pointer"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowAppointmentDetails(true);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {/* ✅ UPDATED: Avatar Logic */}
                            <div className="flex-shrink-0">
                              {appointment.patient_avatar ? (
                                <img
                                  src={appointment.patient_avatar}
                                  alt={appointment.patient_name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                  {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-800 text-base truncate">
                                {appointment.patient_name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                  {formatDate(appointment.appointment_date)}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1.5 flex-shrink-0" />
                                  {formatTime(appointment.appointment_date)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reason Section (Preserved) */}
                          {appointment.reason && (
                            <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 rounded-lg px-3 py-2">
                              <span className="font-medium text-slate-700">Reason:</span> {appointment.reason}
                            </p>
                          )}
                        </div>

                        {/* Status & Action Button (Preserved) */}
                        <div className="flex items-center space-x-2 ml-4">
                          <div
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusIcon(appointment.status)}
                            <span className="capitalize hidden sm:inline">{appointment.status}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              setShowAppointmentDetails(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 hidden sm:block"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Calendar Widget */}
            <div data-tour="doc-calendar" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-900">
                        {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h3>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                            onClick={() => changeMonth('next')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Calendar Header */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={index} className="text-center text-sm font-medium text-slate-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Body (Now Clickable) */}
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center space-x-4 text-xs">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-[#00aeef]"></div>
                        <span className="text-slate-600">Selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">Has Activities</span>
                    </div>
                </div>
            </div>

          {/* Dynamic Schedule List with Booking Indicator */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <img src={clockpic} alt="Clock" className="w-10 h-10 object-contain" />
                <div>
                  {toDateString(selectedDate) === toDateString(new Date()) 
                    ? "Today's Schedule" 
                    : `Schedule for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  }
                </div>
              </h3>
            </div>

            <div className="space-y-3 h-80 overflow-y-auto pr-2 custom-scrollbar">
              {(() => {
                const selectedDateStr = toDateString(selectedDate);
                
                // 1. Get ALL schedules for this date (Available OR Booked)
                // We assume if it's NOT available, it might be booked.
                const daysSchedules = schedules
                  .filter(sch => sch.date === selectedDateStr) 
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                if (daysSchedules.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-sm font-medium">No schedule set for this date</p>
                      <p className="text-xs text-slate-400 mt-1">Click "New Schedule" to add slots</p>
                    </div>
                  );
                }

                return daysSchedules.map((sch) => {
                  // 🕵️‍♂️ CHECK FOR APPOINTMENT
                  const bookedAppt = appointments.find(appt => {
                     // Extract Time from ISO string (e.g., "2023-10-10T09:00:00")
                     const apptTime = appt.appointment_date.split('T')[1]?.substring(0, 5); // "09:00"
                     const schTime = sch.start_time.substring(0, 5); // "09:00"
                     
                     // Match Date AND Time AND valid status
                     return (
                        toDateString(appt.appointment_date) === selectedDateStr &&
                        apptTime === schTime && 
                        appt.status !== 'cancelled'
                     );
                  });

                  const isBooked = !!bookedAppt;

                  return (
                    <div
                      key={sch.id}
                      onClick={() => {
                        if (isBooked) {
                          // 🚀 NAVIGATION LOGIC
                          setSearchTerm(bookedAppt.patient_name); // Auto-filter for the user
                          setActiveTab("all"); // Ensure tab doesn't hide it
                          appointmentsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          toast.success(`Locating appointment for ${bookedAppt.patient_name}...`);
                        }
                      }}
                      className={`
                        p-4 rounded-xl border transition-all duration-300 relative group
                        ${isBooked 
                           ? "bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md hover:border-blue-300" 
                           : sch.is_available 
                              ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200" 
                              : "bg-slate-50 border-slate-100 opacity-60" // Just blocked/unavailable
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-bold ${isBooked ? "text-blue-800" : "text-slate-800"}`}>
                            {sch.start_time.substring(0, 5)} - {sch.end_time.substring(0, 5)}
                          </p>
                          
                          {/* Indicator Text */}
                          {isBooked ? (
                             <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Booked
                                </span>
                                <span className="text-xs text-slate-500 truncate max-w-[100px]">
                                   by {bookedAppt.patient_name}
                                </span>
                             </div>
                          ) : sch.is_available ? (
                             <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                Available
                             </p>
                          ) : (
                             <p className="text-xs text-slate-400 mt-1">Unavailable</p>
                          )}
                        </div>

                        {/* Status Icon */}
                        <div className={`
                           w-8 h-8 rounded-full flex items-center justify-center
                           ${isBooked ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}
                        `}>
                           {isBooked ? <Eye className="w-4 h-4" /> : <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />}
                        </div>
                      </div>

                      {/* Hover Hint for Booked Items */}
                      {isBooked && (
                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                           <span className="text-xs font-bold text-blue-700 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
                              View Appointment →
                           </span>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Modal Para Sa Mga Gwapo*/}
      {showAppointmentDetails && <AppointmentDetailsModal />}
    </div>
  );
};

export default DoctorDashboard;