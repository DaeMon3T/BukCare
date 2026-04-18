import { useState, useEffect } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  QrCode,
  UserPlus,
  ClipboardList,
  Activity,
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
import completepic from "@/assets/images/complete.png";
import cancelpic from "@/assets/images/cancel.png";
import bukcarelogo from "@/assets/images/bukcare_logo.png";

// ─── Types ────────────────────────────────────────────────────────────
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

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────
const CHART_COLORS = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  completed: "#3B82F6",
  cancelled: "#EF4444",
};

const toDateString = (dateInput: string | Date): string => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ─── Component ────────────────────────────────────────────────────────
const StaffDashboard: FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ─── Data Fetching ────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const appointmentsRes = await api.get<Appointment[]>("/appointments/doctor");
      setAppointments(appointmentsRes.data);
      calculateStats(appointmentsRes.data);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsData: Appointment[]) => {
    const todayStr = toDateString(new Date());
    const newStats: DashboardStats = {
      totalAppointments: appointmentsData.length,
      todayAppointments: appointmentsData.filter((apt) => {
        const aptDateStr = apt.appointment_date.split("T")[0] ?? "";
        return aptDateStr === todayStr && apt.status !== "cancelled";
      }).length,
      upcomingAppointments: appointmentsData.filter((apt) => {
        const aptDateStr = apt.appointment_date.split("T")[0] ?? "";
        return aptDateStr > todayStr && apt.status !== "cancelled";
      }).length,
      pendingAppointments: appointmentsData.filter((apt) => apt.status === "pending").length,
      confirmedAppointments: appointmentsData.filter((apt) => apt.status === "confirmed").length,
      completedAppointments: appointmentsData.filter((apt) => apt.status === "completed").length,
      cancelledAppointments: appointmentsData.filter((apt) => apt.status === "cancelled").length,
    };
    setStats(newStats);
  };

  // ─── Chart Data ───────────────────────────────────────────────────
  const getWeeklyTrendData = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= date && aptDate < nextDate;
      });

      weekData.push({
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        pending: dayAppointments.filter((a) => a.status === "pending").length,
        confirmed: dayAppointments.filter((a) => a.status === "confirmed").length,
        completed: dayAppointments.filter((a) => a.status === "completed").length,
      });
    }
    return weekData;
  };

  const getStatusDistributionData = () =>
    [
      { name: "Pending", value: stats.pendingAppointments, color: CHART_COLORS.pending },
      { name: "Confirmed", value: stats.confirmedAppointments, color: CHART_COLORS.confirmed },
      { name: "Completed", value: stats.completedAppointments, color: CHART_COLORS.completed },
      { name: "Cancelled", value: stats.cancelledAppointments, color: CHART_COLORS.cancelled },
    ].filter((item) => item.value > 0);

  // ─── Helpers ──────────────────────────────────────────────────────
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed": return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "pending": return "text-amber-700 bg-amber-50 border-amber-200";
      case "cancelled": return "text-rose-700 bg-rose-50 border-rose-200";
      case "completed": return "text-blue-700 bg-blue-50 border-blue-200";
      default: return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <AlertCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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

    if (aptDate.getTime() === today.getTime()) return "Today";
    if (aptDate.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

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

    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  // ─── Status Update (Staff Can Now Do This!) ───────────────────────
  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      fetchData();
      setShowAppointmentDetails(false);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  // ─── Calendar ─────────────────────────────────────────────────────
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const getAppointmentsForDate = (date: Date) =>
    appointments.filter((apt) => {
      const aptDate = new Date(apt.appointment_date);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    });

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 bg-slate-50/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = toDateString(date);
      const isToday = dateStr === toDateString(today);
      const isSelected = dateStr === toDateString(selectedDate);
      const dayAppointments = getAppointmentsForDate(date);
      const hasEvents = dayAppointments.length > 0;

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
          <div className={`font-medium ${isSelected ? "text-white" : isToday ? "text-blue-600" : "text-slate-700"}`}>
            {day}
          </div>
          {hasEvents && (
            <div className="flex gap-1 mt-1 absolute bottom-1.5 right-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}></div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") newDate.setMonth(newDate.getMonth() - 1);
      else newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // ─── Appointment Details Modal ────────────────────────────────────
  const AppointmentDetailsModal: FC = () =>
    selectedAppointment ? (
      <div className="fixed inset-0 bg-gradient-to-br from-black/70 via-slate-900/60 to-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg md:max-w-2xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[95vh] overflow-hidden border border-white/20">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-teal-700 to-[#00aeef] p-4 sm:p-5 flex-none z-10">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
            </div>
            <div className="relative z-10 flex justify-between items-start gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden xs:flex w-12 h-12 sm:w-16 sm:h-16 bg-white backdrop-blur-lg rounded-xl sm:rounded-2xl items-center justify-center border border-white/30 shadow-xl flex-shrink-0">
                  <img src={bukcarelogo} alt="BukCare" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1 tracking-tight">Appointment Details</h2>
                  <p className="text-teal-100 text-xs sm:text-sm font-medium">Staff Management View</p>
                </div>
              </div>
              <button onClick={() => setShowAppointmentDetails(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:rotate-90">
                <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 bg-slate-50/50">
            {/* Patient Info */}
            <div className="relative bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="relative flex-shrink-0">
                {selectedAppointment.patient_avatar ? (
                  <img src={selectedAppointment.patient_avatar} alt={selectedAppointment.patient_name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg border-4 border-white" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-teal-500 via-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg border-4 border-white">
                    {selectedAppointment.patient_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Patient</h3>
                <p className="text-xl sm:text-2xl font-bold text-slate-900 truncate leading-tight">{selectedAppointment.patient_name}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold font-mono">ID: {selectedAppointment.patient_id}</span>
                </div>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase mb-1">Assigned Doctor</p>
              <p className="font-bold text-slate-900">{selectedAppointment.doctor_name}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                  <img src={appointmentpic} alt="Date" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                  <p className="font-bold text-slate-900">{formatDate(selectedAppointment.appointment_date)}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                  <img src={pendingpic} alt="Time" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Time</p>
                  <p className="font-bold text-slate-900">{formatTime(selectedAppointment.appointment_date)}</p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3 sm:block sm:text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center sm:mx-auto sm:mb-2">
                  <img src={confirmedpic} alt="Status" className="w-6 h-6 object-contain" />
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
                    <ClipboardList className="w-4 h-4" /> Reason
                  </h4>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{selectedAppointment.reason}</p>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="bg-purple-50/50 p-4 sm:p-5 rounded-xl border border-purple-100">
                  <h4 className="text-xs font-bold text-purple-700 uppercase mb-2">📝 Notes</h4>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions — Staff CAN now manage appointments */}
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-white flex-none z-10">
            <div className="flex flex-col sm:flex-row gap-3">
              {selectedAppointment.status === "pending" && (
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
              {selectedAppointment.status === "confirmed" && new Date(selectedAppointment.appointment_date) <= new Date() && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Mark as Completed
                </button>
              )}
              {selectedAppointment.status === "confirmed" && new Date(selectedAppointment.appointment_date) > new Date() && (
                <p className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 w-full px-4">
                  Completion available after: <span className="font-bold text-slate-500">{new Date(selectedAppointment.appointment_date).toLocaleString()}</span>
                </p>
              )}
              {(selectedAppointment.status === "completed" || selectedAppointment.status === "cancelled") && (
                <p className="text-center text-sm text-slate-400 py-2 w-full">
                  This appointment has been {selectedAppointment.status}.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredAppointments = filterAppointments();
  const weeklyTrendData = getWeeklyTrendData();
  const statusDistributionData = getStatusDistributionData();

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>
      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Staff Dashboard</h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base">
                Welcome back, {user?.fname}! Manage today's appointments and walk-ins.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/staff/walk-in")}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm text-sm sm:text-base"
              >
                <UserPlus className="w-5 h-5" />
                <span>Walk-in</span>
              </button>
              <button
                onClick={() => navigate("/staff/scan")}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm sm:text-base"
              >
                <QrCode className="w-5 h-5" />
                <span>Scan Patient</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Statistics Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 mb-5">
          {/* TODAY */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={appointmentpic} alt="Today" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
                <div className="hidden sm:flex w-10 h-10 bg-white/20 backdrop-blur-md rounded-full items-center justify-center border border-white/30">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">Today</p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight mb-0 sm:mb-3">{stats.todayAppointments}</p>
              <div className="hidden sm:block mt-3 w-full bg-slate-300/30 rounded-full h-2 overflow-hidden border border-white/20">
                <div className="bg-gradient-to-r from-green-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min((stats.todayAppointments / 10) * 100, 100)}%` }} />
              </div>
              <p className="hidden sm:block text-xs text-slate-500 mt-2 font-medium">{Math.min(Math.round((stats.todayAppointments / 10) * 100), 100)}% capacity</p>
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
                <div className="hidden sm:block w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">Pending</p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight">{stats.pendingAppointments}</p>
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
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">Confirmed</p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight">{stats.confirmedAppointments}</p>
            </div>
          </div>

          {/* COMPLETED */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={completepic} alt="Completed" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">Completed</p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight">{stats.completedAppointments}</p>
            </div>
          </div>

          {/* CANCELLED */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-white/40 shadow-md sm:shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/30 backdrop-blur-lg border border-white/40 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <img src={cancelpic} alt="Cancelled" className="w-5 h-5 sm:w-7 sm:h-7 object-contain" />
                </div>
              </div>
              <p className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-1 sm:mb-2 truncate">Cancelled</p>
              <p className="text-2xl sm:text-5xl font-bold text-slate-900 leading-tight">{stats.cancelledAppointments}</p>
            </div>
          </div>
        </div>

        {/* ─── Main Content Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* LEFT: Appointment List (2 cols) */}
          <div className="xl:col-span-2 space-y-5">
            {/* Tabs + Search */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/50 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {(["today", "upcoming", "all"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === tab
                          ? "bg-teal-600 text-white shadow-md"
                          : "bg-white/50 text-slate-600 hover:bg-white"
                      }`}
                    >
                      {tab === "today" ? "Today" : tab === "upcoming" ? "Upcoming" : "All"}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                  />
                </div>
              </div>

              {/* Appointment List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No appointments {activeTab !== "all" ? activeTab : "found"}</p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setShowAppointmentDetails(true);
                      }}
                      className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {apt.patient_avatar ? (
                          <img src={apt.patient_avatar} alt={apt.patient_name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
                            {apt.patient_name.split(" ").map((n) => n[0]).join("")}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{apt.patient_name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            Dr. {apt.doctor_name} • {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(apt.status)}`}>
                          {getStatusIcon(apt.status)} {apt.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Weekly Trend */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-lg">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-500" /> Weekly Trends
                </h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
                      <Bar dataKey="pending" stackId="a" fill={CHART_COLORS.pending} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="confirmed" stackId="a" fill={CHART_COLORS.confirmed} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="completed" stackId="a" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-lg">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-500" /> Status Distribution
                </h3>
                <div className="h-52">
                  {statusDistributionData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "12px" }} />
                        <Legend iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-xs font-medium text-slate-600">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Calendar (1 col) */}
          <div className="space-y-5">
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => changeMonth("prev")} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                <h3 className="text-sm font-bold text-slate-700">{currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}</h3>
                <button onClick={() => changeMonth("next")} className="p-2 hover:bg-slate-100 rounded-lg transition"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
              </div>
              <div className="grid grid-cols-7 gap-0">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase pb-2">{d}</div>
                ))}
                {renderCalendar()}
              </div>
            </div>

            {/* Selected Date Appointments */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/50 shadow-lg">
              <h3 className="text-sm font-bold text-slate-700 mb-3">
                {toDateString(selectedDate) === toDateString(new Date()) ? "Today's" : formatDate(toDateString(selectedDate))} Appointments
              </h3>
              <div className="space-y-2">
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No appointments on this date</p>
                ) : (
                  getAppointmentsForDate(selectedDate).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setShowAppointmentDetails(true);
                      }}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:shadow-sm cursor-pointer transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{apt.patient_name}</p>
                        <p className="text-[10px] text-slate-500">{formatTime(apt.appointment_date)} • Dr. {apt.doctor_name}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAppointmentDetails && <AppointmentDetailsModal />}
    </div>
  );
};

export default StaffDashboard;
