import { useState, useEffect } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
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
  Filter,
  Download,
  Plus,
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
import api from "@/utils/api";
import appointmentpic from "@/assets/appointment.png";
import pendingpic from "@/assets/pending.png";
import confirmedpic from "@/assets/confirmed.png";
import patientpic from "@/assets/patient.png";
import availability from "@/assets/set_availability.png";
import history from "@/assets/history.png";
import bukcarelogo from "@/assets/bukcare_logo.png";
import clockpic from "@/assets/clock.png";
import completepic from "@/assets/complete.png";
import cancelpic from "@/assets/cancel.png";

// 🩺 Appointment type definition
interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 📊 Dashboard Statistics
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

const DoctorDashboard: FC = () => {
  const navigate = useNavigate();
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
      const [appointmentsRes, schedulesRes] = await Promise.all([
        api.get<Appointment[]>("/appointments/"),
        api.get<Schedule[]>("/schedules"),
      ]);
      
      setAppointments(appointmentsRes.data);
      setSchedules(schedulesRes.data);
      calculateStats(appointmentsRes.data);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsData: Appointment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats: DashboardStats = {
      totalAppointments: appointmentsData.length,
      todayAppointments: appointmentsData.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      }).length,
      upcomingAppointments: appointmentsData.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate > today && apt.status !== "cancelled";
      }).length,
      pendingAppointments: appointmentsData.filter((apt) => apt.status === "pending").length,
      confirmedAppointments: appointmentsData.filter((apt) => apt.status === "confirmed").length,
      completedAppointments: appointmentsData.filter((apt) => apt.status === "completed").length,
      cancelledAppointments: appointmentsData.filter((apt) => apt.status === "cancelled").length,
    };

    setStats(stats);
  };

  // Generate weekly trend data from actual appointments
  const getWeeklyTrendData = () => {
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= date && aptDate < nextDate;
      });
      
      weekData.push({
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
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
      await api.put(`/appointments/${appointmentId}/status?status=${newStatus}`);
      toast.success(`Appointment ${newStatus}`);
      fetchData();
      setShowAppointmentDetails(false);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update appointment status");
    }
  };

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
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter((sch) => sch.date === dateStr && sch.is_available);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isToday = date.getTime() === today.getTime();
      const dayAppointments = getAppointmentsForDate(date);
      const daySchedules = getSchedulesForDate(date);
      const hasEvents = dayAppointments.length > 0 || daySchedules.length > 0;

      days.push(
        <div
          key={day}
          className={`h-14 border border-slate-100 p-1 text-sm transition-colors cursor-pointer ${
            isToday ? "bg-blue-50 border-blue-300" : "hover:bg-slate-50"
          }`}
        >
          <div className={`font-medium ${isToday ? "text-blue-600" : "text-slate-700"}`}>
            {day}
          </div>
          {hasEvents && (
            <div className="flex gap-0.5 mt-0.5">
              {dayAppointments.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              )}
              {daySchedules.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
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
    <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[95vh] overflow-hidden transform animate-in zoom-in-95 duration-300 border border-white/20">
        {/* Premium Header with Glass Effect */}
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 p-4 overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" 
                 style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
                         backgroundSize: '40px 40px'}}></div>
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Icon placeholder - replace with your image */}
              <div className="w-16 h-16 bg-white backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <img 
                  src={bukcarelogo} 
                  alt="Appointment" 
                  className="w-30 h-30 object-contain"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">
                  Appointment Details
                </h2>
                <p className="text-blue-100 text-sm font-medium">Complete appointment information</p>
              </div>
            </div>
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="text-white/70 hover:text-white hover:bg-white/20 p-2.5 rounded-xl transition-all duration-200 hover:rotate-90 transform"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Patient Information - Premium Card */}
          <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-6 border-2 border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:translate-x-full" 
                 style={{width: '50%', transition: 'transform 0.8s ease'}}></div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white">
                  {selectedAppointment.patient_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white shadow-md"></div>
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Patient Information</h3>
                <p className="text-2xl font-bold text-slate-900 mb-1">{selectedAppointment.patient_name}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    Patient ID: {selectedAppointment.patient_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details Grid - Modern Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Card */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-5 border border-blue-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  <img 
                    src={appointmentpic} 
                    alt="Date" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <p className="text-xs text-black/80 font-bold uppercase tracking-wide mb-1">Date</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatDate(selectedAppointment.appointment_date)}
                </p>
              </div>
            </div>

            {/* Time Card */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-5 border border-purple-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  {/* Icon placeholder */}
                  <img 
                    src={pendingpic}
                    alt="Time" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <p className="text-xs text-black/80 font-bold uppercase tracking-wide mb-1">Time</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatTime(selectedAppointment.appointment_date)}
                </p>
              </div>
            </div>

            {/* Status Card */}
            <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl p-5 border border-emerald-200/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                  {/* Icon placeholder */}
                  <img 
                    src={confirmedpic}
                    alt="Status" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <p className="text-xs text-black/80 font-bold uppercase tracking-wide mb-1">Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {getStatusIcon(selectedAppointment.status)}
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Reason for Visit - Enhanced */}
          {selectedAppointment.reason && (
            <div className="relative bg-gradient-to-br from-blue-50 via-cyan-50/50 to-blue-50/30 rounded-2xl p-6 border-2 border-blue-200/70 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  {/* Icon placeholder */}
                  <img 
                    src={history}
                    alt="Reason" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    Reason for Visit
                    <span className="w-12 h-0.5 bg-blue-300 rounded-full"></span>
                  </h3>
                  <p className="text-base text-slate-800 leading-relaxed font-medium">{selectedAppointment.reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes - Enhanced */}
          {selectedAppointment.notes && (
            <div className="relative bg-gradient-to-br from-purple-50 via-fuchsia-50/50 to-purple-50/30 rounded-2xl p-6 border-2 border-purple-200/70 shadow-md hover:shadow-lg transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  {/* Icon placeholder */}
                  <img 
                    src="/path-to-your-notes-icon.png" 
                    alt="Notes" 
                    className="w-7 h-7 object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    Additional Notes
                    <span className="w-12 h-0.5 bg-purple-300 rounded-full"></span>
                  </h3>
                  <p className="text-base text-slate-800 leading-relaxed font-medium">{selectedAppointment.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Premium Style */}
          <div className="flex gap-4 pt-6 border-t-2 border-slate-200">
            {selectedAppointment.status === "pending" && (
              <>
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed")}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-2xl hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700 font-bold transition-all shadow-lg shadow-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 text-base tracking-wide relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                  <CheckCircle className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Confirm Appointment</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled")}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 text-white rounded-2xl hover:from-rose-700 hover:via-red-700 hover:to-rose-700 font-bold transition-all shadow-lg shadow-rose-500/40 hover:shadow-2xl hover:shadow-rose-500/50 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 text-base tracking-wide relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                  <XCircle className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Cancel Appointment</span>
                </button>
              </>
            )}
            {selectedAppointment.status === "confirmed" && (
              <button
                onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white rounded-2xl hover:from-blue-700 hover:via-cyan-700 hover:to-blue-700 font-bold transition-all shadow-lg shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.03] active:scale-[0.98] flex items-center justify-center gap-3 text-base tracking-wide relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                <CheckCircle className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Mark as Completed</span>
              </button>
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
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600 mt-2">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                onClick={() => navigate('/doctor/set-availability')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {/* TODAY'S APPOINTMENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            {/* Glass reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-6 h-6 bg-white/30 backdrop-blur-lg border border-white/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                  <img src={appointmentpic} alt="Icon" className="w-7 h-7 object-contain" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">
                Today's Appointments
              </p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">
                {stats.todayAppointments}
              </p>
              <div className="mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.todayAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.todayAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* PENDING */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                  <img src={pendingpic} alt="Pending" className="w-7 h-7 object-contain" />
                </div>
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">
                Pending
              </p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">
                {stats.pendingAppointments}
              </p>
              <div className="mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.pendingAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.pendingAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* CONFIRMED */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                  <img src={confirmedpic} alt="Confirmed" className="w-7 h-7 object-contain" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <CheckCircle className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">
                Confirmed
              </p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">
                {stats.confirmedAppointments}
              </p>
              <div className="mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${Math.min((stats.confirmedAppointments / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                {Math.min(Math.round((stats.confirmedAppointments / 10) * 100), 100)}% capacity
              </p>
            </div>
          </div>

          {/* TOTAL APPOINTMENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white/40 transition-all duration-300">
                  <img src={patientpic} alt="Total" className="w-7 h-7 object-contain" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <span className="text-xs font-bold text-slate-700">All</span>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">
                Total Appointments
              </p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">
                {stats.totalAppointments}
              </p>
              <div className="mt-3 w-full bg-slate-300/30 backdrop-blur-sm rounded-full h-2 overflow-hidden border border-white/20">
                <div 
                  className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: '100%' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                Complete overview
              </p>
            </div>
          </div>

          {/* Overview Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Overview
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Pending", value: stats.pendingAppointments, img: pendingpic, textColor: "text-blue-600" },
                  { label: "Confirmed", value: stats.confirmedAppointments, img: confirmedpic, textColor: "text-blue-600" },
                  { label: "Completed", value: stats.completedAppointments, img: completepic, textColor: "text-blue-600" },
                  { label: "Cancelled", value: stats.cancelledAppointments, img: cancelpic, textColor: "text-blue-600" },
                ].map((stat, index) => (
                  <div key={stat.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div>
                        <img
                          src={stat.img} alt={stat.label} className="w-5 h-5 object-contain"
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{stat.label}</span>
                    </div>
                    <span className={`font-bold ${stat.textColor}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
        </div>


        {/* Charts and Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-8">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trends Chart */}
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 p-6 relative overflow-hidden">
                {/* Subtle decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Weekly Trends</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Appointment overview</p>
                    </div>
                  </div>

                  {/* Legend */}
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

                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={weeklyTrendData}>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#b4b8bcff" strokeOpacity={5} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#000000ff" 
                        fontSize={12}
                        tick={{ fill: '#000000ff' }}
                        tickLine={{ stroke: '#030303ff' }}
                      />
                      <YAxis 
                        stroke="#000000ff" 
                        fontSize={12}
                        tick={{ fill: '#000000ff' }}
                        tickLine={{ stroke: '#010101ff' }}
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                      />
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
                        cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                      />
                      <Bar 
                        dataKey="pending" 
                        fill="url(#pendingGradient)" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      />
                      <Bar 
                        dataKey="confirmed" 
                        fill="url(#confirmedGradient)" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      />
                      <Bar 
                        dataKey="completed" 
                        fill="url(#completedGradient)" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/doctor/set-availability')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    {/* Placeholder for icon */}
                    <img
                      src={availability}
                      alt="Set Availability"
                      className="w-6 h-6 object-contain rounded"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">Set Availability</h3>
                    <p className="text-sm text-slate-600 mt-1">Manage your schedule</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/doctor/appointments')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    {/* Placeholder for icon */}
                    <img
                      src={appointmentpic}
                      alt="All Appointments"
                      className="w-6 h-6 object-contain rounded"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">All Appointments</h3>
                    <p className="text-sm text-slate-600 mt-1">View all details</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/doctor/appointment-history')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    {/* Placeholder for icon */}
                    <img
                      src={history}
                      alt="Appointment History"
                      className="w-7 h-7 object-contain rounded"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">History</h3>
                    <p className="text-sm text-slate-600 mt-1">Past appointments</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-xl font-semibold text-slate-900">Appointments</h2>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setActiveTab("today")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === "today"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setActiveTab("upcoming")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === "upcoming"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Upcoming
                      </button>
                      <button
                        onClick={() => setActiveTab("all")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {appointment.patient_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 text-base">
                                {appointment.patient_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1.5" />
                                  {formatDate(appointment.appointment_date)}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1.5" />
                                  {formatTime(appointment.appointment_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 rounded-lg px-3 py-2">
                              <span className="font-medium text-slate-700">Reason:</span> {appointment.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusIcon(appointment.status)}
                            <span className="capitalize">{appointment.status}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              setShowAppointmentDetails(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
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

              {/* Calendar Body */}
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600">Appointments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600">Available</span>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <img
                    src={clockpic}
                    alt="Clock"
                    className="w-10 h-10 mr-2 object-contain"
                  />
                  Today's Schedule
                </h3>
                <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {schedules.filter(sch => {
                    const today = new Date().toISOString().split('T')[0];
                    return sch.date === today && sch.is_available;
                  }).length} slots
                </span>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {schedules
                  .filter((sch) => {
                    const today = new Date().toISOString().split('T')[0];
                    return sch.date === today && sch.is_available;
                  })
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((sch, index) => (
                    <div
                      key={sch.id}
                      className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {sch.start_time} - {sch.end_time}
                          </p>
                          {sch.notes && (
                            <p className="text-xs text-slate-600 mt-1">{sch.notes}</p>
                          )}
                        </div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                {schedules.filter((sch) => {
                  const today = new Date().toISOString().split('T')[0];
                  return sch.date === today && sch.is_available;
                }).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm font-medium">No schedule set for today</p>
                  </div>
                )}
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