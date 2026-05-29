import { useState, useEffect, useMemo } from "react";
import type { FC, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  QrCode,
  UserPlus,
  ClipboardList,
  Stethoscope,
  Users,
  Activity,
  TrendingUp,
  Shield,
  ShieldCheck,
  Eye,
  ChevronRight as ArrowRight,
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
import StaffAccessAPI from "@/services/staff/StaffAccessAPI";
import type { DoctorAccessRecord } from "@/services/staff/StaffAccessAPI";

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

// ─── Constants ────────────────────────────────────────────────────────
const CHART_COLORS = {
  pending: "#F59E0B",
  confirmed: "#10B981",
  completed: "#3B82F6",
  cancelled: "#EF4444",
};

type StatusStyle = { badge: string; dot: string; text: string };
const STATUS_STYLES: Record<string, StatusStyle> = {
  confirmed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "Confirmed" },
  pending:   { badge: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500",   text: "Pending" },
  cancelled: { badge: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500",    text: "Cancelled" },
  completed: { badge: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500",    text: "Completed" },
  expired:   { badge: "bg-slate-100 text-slate-500 border-slate-200",      dot: "bg-slate-400",   text: "Expired" },
};
const DEFAULT_STATUS: StatusStyle = { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", text: "Unknown" };
const getStatusStyle = (s: string): StatusStyle => STATUS_STYLES[s] ?? DEFAULT_STATUS;

// ─── Helpers ──────────────────────────────────────────────────────────
const toDateString = (dateInput: string | Date): string => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

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
  const [assignedDoctors, setAssignedDoctors] = useState<DoctorAccessRecord[]>([]);

  // ─── Data Fetching ────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
    fetchAssignedDoctors();
  }, []);

  const fetchAssignedDoctors = async () => {
    try {
      const data = await StaffAccessAPI.getMyDoctors();
      setAssignedDoctors(data);
    } catch (error: any) {
      console.error("Failed to load assigned doctors:", error);
    }
  };

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

  const calculateStats = (data: Appointment[]) => {
    const todayStr = toDateString(new Date());
    setStats({
      totalAppointments: data.length,
      todayAppointments: data.filter((a) => {
        const d = a.appointment_date.split("T")[0] ?? "";
        return d === todayStr && a.status !== "cancelled";
      }).length,
      upcomingAppointments: data.filter((a) => {
        const d = a.appointment_date.split("T")[0] ?? "";
        return d > todayStr && a.status !== "cancelled";
      }).length,
      pendingAppointments: data.filter((a) => a.status === "pending").length,
      confirmedAppointments: data.filter((a) => a.status === "confirmed").length,
      completedAppointments: data.filter((a) => a.status === "completed").length,
      cancelledAppointments: data.filter((a) => a.status === "cancelled").length,
    });
  };

  // ─── Permissions ──────────────────────────────────────────────────
  const permissionMap = useMemo(
    () => Object.fromEntries(assignedDoctors.map((r) => [r.doctor_id, r])),
    [assignedDoctors]
  );
  const canManage = (doctorId: number) =>
    !!permissionMap[doctorId]?.can_manage_appointments;

  // ─── Charts ───────────────────────────────────────────────────────
  const weeklyTrendData = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    start.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const day = appointments.filter((a) => {
        const ad = new Date(a.appointment_date);
        return ad >= date && ad < next;
      });
      return {
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        pending: day.filter((a) => a.status === "pending").length,
        confirmed: day.filter((a) => a.status === "confirmed").length,
        completed: day.filter((a) => a.status === "completed").length,
      };
    });
  }, [appointments]);

  const statusDistributionData = useMemo(
    () =>
      [
        { name: "Pending", value: stats.pendingAppointments, color: CHART_COLORS.pending },
        { name: "Confirmed", value: stats.confirmedAppointments, color: CHART_COLORS.confirmed },
        { name: "Completed", value: stats.completedAppointments, color: CHART_COLORS.completed },
        { name: "Cancelled", value: stats.cancelledAppointments, color: CHART_COLORS.cancelled },
      ].filter((item) => item.value > 0),
    [stats]
  );

  // ─── Helpers ──────────────────────────────────────────────────────
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

  const filteredAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let filtered = appointments;
    if (activeTab === "today") {
      filtered = filtered.filter((a) => {
        const d = new Date(a.appointment_date);
        return d >= today && d < tomorrow;
      });
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter((a) => {
        const d = new Date(a.appointment_date);
        return d >= tomorrow && a.status !== "cancelled";
      });
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patient_name.toLowerCase().includes(q) ||
          a.doctor_name?.toLowerCase().includes(q) ||
          a.reason?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [appointments, activeTab, searchTerm]);

  // ─── Status update ─────────────────────────────────────────────────
  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      fetchData();
      setShowAppointmentDetails(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update appointment");
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
    appointments.filter((a) => {
      const d = new Date(a.appointment_date);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days: ReactNode[] = [];
    const today = new Date();

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = toDateString(date);
      const isToday = dateStr === toDateString(today);
      const isSelected = dateStr === toDateString(selectedDate);
      const dayAppointments = getAppointmentsForDate(date);
      const hasEvents = dayAppointments.length > 0;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`relative h-10 rounded-lg text-sm font-medium transition-all
            ${isSelected
              ? "bg-teal-600 text-white shadow-sm"
              : isToday
                ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
                : "text-slate-700 hover:bg-slate-100"
            }`}
        >
          {day}
          {hasEvents && (
            <span
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                isSelected ? "bg-white" : "bg-teal-500"
              }`}
            />
          )}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === "prev" ? -1 : 1));
      return newDate;
    });
  };

  // ─── Permission badges ────────────────────────────────────────────
  const accessLevel = (rec: DoctorAccessRecord) => {
    if (rec.can_manage_appointments) return { label: "Full Access", icon: ShieldCheck, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (rec.can_book_walkins || rec.can_register_patients) return { label: "Receptionist", icon: Shield, color: "text-blue-700 bg-blue-50 border-blue-200" };
    return { label: "Observer", icon: Eye, color: "text-slate-600 bg-slate-50 border-slate-200" };
  };

  // ─── Appointment Details Modal ────────────────────────────────────
  const renderActions = () => {
    if (!selectedAppointment) return null;
    const allowed = canManage(selectedAppointment.doctor_id);
    const status = selectedAppointment.status;
    const apptTime = new Date(selectedAppointment.appointment_date);

    if (!allowed) {
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 w-full">
          <Eye className="w-4 h-4" />
          You have view-only access for this doctor's appointments.
        </div>
      );
    }
    if (status === "pending") {
      return (
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed")}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Confirm
          </button>
          <button
            onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled")}
            className="flex-1 py-2.5 px-4 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        </div>
      );
    }
    if (status === "confirmed") {
      if (apptTime <= new Date()) {
        return (
          <button
            onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Mark as Completed
          </button>
        );
      }
      return (
        <p className="text-center text-xs text-slate-500 py-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200 w-full px-3">
          Completion available after{" "}
          <span className="font-semibold text-slate-700">{apptTime.toLocaleString()}</span>
        </p>
      );
    }
    return (
      <p className="text-center text-sm text-slate-500 py-2 w-full capitalize">
        This appointment has been {status}.
      </p>
    );
  };

  const AppointmentDetailsModal: FC = () => {
    if (!selectedAppointment) return null;
    const meta = getStatusStyle(selectedAppointment.status);
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Appointment Details</h2>
                <p className="text-xs text-slate-500">Reference #{selectedAppointment.id}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Status banner */}
            <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold ${meta.badge}`}>
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              {meta.text}
            </div>

            {/* Patient */}
            <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3 border border-slate-100">
              {selectedAppointment.patient_avatar ? (
                <img
                  src={selectedAppointment.patient_avatar}
                  alt={selectedAppointment.patient_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                  {getInitials(selectedAppointment.patient_name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Patient</p>
                <p className="text-base font-semibold text-slate-900 truncate">{selectedAppointment.patient_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">ID #{selectedAppointment.patient_id}</p>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {formatDate(selectedAppointment.appointment_date)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Time</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {formatTime(selectedAppointment.appointment_date)}
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3 col-span-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Doctor</p>
                <p className="text-sm font-semibold text-slate-900 mt-1 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  {selectedAppointment.doctor_name}
                </p>
              </div>
            </div>

            {/* Reason / Notes */}
            {selectedAppointment.reason && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedAppointment.reason}</p>
              </div>
            )}
            {selectedAppointment.notes && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{selectedAppointment.notes}</p>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
            {renderActions()}
          </div>
        </div>
      </div>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-teal-600 mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Stat tiles config ────────────────────────────────────────────
  const statTiles = [
    { label: "Today", value: stats.todayAppointments,     icon: Calendar,    color: "teal",    sub: "scheduled today" },
    { label: "Pending", value: stats.pendingAppointments, icon: AlertCircle, color: "amber",   sub: "awaiting review" },
    { label: "Confirmed", value: stats.confirmedAppointments, icon: CheckCircle, color: "emerald", sub: "ready to see" },
    { label: "Completed", value: stats.completedAppointments, icon: Activity, color: "blue",    sub: "this period" },
    { label: "Cancelled", value: stats.cancelledAppointments, icon: XCircle,  color: "rose",    sub: "this period" },
  ] as const;

  type TileColor = { bg: string; text: string; ring: string };
  const colorMap: Record<string, TileColor> = {
    teal:    { bg: "bg-teal-50",    text: "text-teal-600",    ring: "ring-teal-100" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    blue:    { bg: "bg-blue-50",    text: "text-blue-600",    ring: "ring-blue-100" },
    rose:    { bg: "bg-rose-50",    text: "text-rose-600",    ring: "ring-rose-100" },
  };
  const fallbackColor: TileColor = { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-100" };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ─── Welcome Header ─────────────────────────────────────── */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-600 mb-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500" />
              Staff Workspace
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
              Good day, {user?.fname || "Staff"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {assignedDoctors.length === 0
                ? "Awaiting access from a doctor to begin assisting."
                : `Assisting ${assignedDoctors.length} doctor${assignedDoctors.length > 1 ? "s" : ""} today.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate("/staff/walk-in")}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-slate-700 hover:text-teal-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              <UserPlus className="w-4 h-4" />
              Walk-in
            </button>
            <button
              data-tour="staff-scan"
              onClick={() => navigate("/staff/scan")}
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
            >
              <QrCode className="w-4 h-4" />
              Scan Patient
            </button>
          </div>
        </header>

        {/* ─── Assigned Doctors ──────────────────────────────────── */}
        {assignedDoctors.length === 0 ? (
          <div data-tour="staff-doctors" className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900">No access granted yet</h3>
              <p className="text-sm text-amber-800/80 mt-0.5">
                Once a doctor grants you access from their <span className="font-semibold">Manage Staff</span> page, their appointments will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div data-tour="staff-doctors" className="bg-white border border-slate-200 rounded-2xl">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Assigned Doctors
                <span className="text-xs font-medium text-slate-400">({assignedDoctors.length})</span>
              </h3>
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedDoctors.map((doc) => {
                const lvl = accessLevel(doc);
                const Icon = lvl.icon;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 transition"
                  >
                    {doc.doctor_picture ? (
                      <img src={doc.doctor_picture} alt={doc.doctor_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {getInitials(doc.doctor_name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">Dr. {doc.doctor_name}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold border ${lvl.color}`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {lvl.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── KPI Stats ──────────────────────────────────────────── */}
        <div data-tour="staff-stats" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statTiles.map((tile) => {
            const c = colorMap[tile.color] ?? fallbackColor;
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ring-1 ${c.bg} ${c.ring}`}>
                    <Icon className={`w-4.5 h-4.5 ${c.text}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {tile.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mt-0.5">
                    {tile.value}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tile.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Main Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* LEFT — Appointments + Charts */}
          <div className="xl:col-span-2 space-y-5">
            {/* Tabs + Search + List */}
            <div data-tour="staff-appointments" className="bg-white border border-slate-200 rounded-2xl">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg">
                  {(["today", "upcoming", "all"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                        activeTab === tab
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab === "today" ? "Today" : tab === "upcoming" ? "Upcoming" : "All"}
                    </button>
                  ))}
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search patient, doctor, reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-3">
                      <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No appointments {activeTab !== "all" ? activeTab : "found"}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm ? "Try a different search." : "Check back soon or switch tabs."}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => {
                    const meta = getStatusStyle(apt.status);
                    const allowed = canManage(apt.doctor_id);
                    return (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowAppointmentDetails(true);
                        }}
                        className="px-5 py-3.5 hover:bg-slate-50 transition cursor-pointer flex items-center gap-3 group"
                      >
                        {apt.patient_avatar ? (
                          <img
                            src={apt.patient_avatar}
                            alt={apt.patient_name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {getInitials(apt.patient_name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{apt.patient_name}</p>
                            {!allowed && (
                              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-slate-200 bg-slate-50 text-slate-500">
                                <Eye className="w-2.5 h-2.5" /> View
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            <Stethoscope className="w-3 h-3 inline -mt-0.5 mr-1 text-slate-400" />
                            Dr. {apt.doctor_name} · {formatDate(apt.appointment_date)} · {formatTime(apt.appointment_date)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.badge} flex-shrink-0`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.text}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition flex-shrink-0 hidden sm:block" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Charts */}
            <div data-tour="staff-charts" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    Weekly Trends
                  </h3>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #E2E8F0",
                          fontSize: "12px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                        }}
                      />
                      <Bar dataKey="pending" stackId="a" fill={CHART_COLORS.pending} />
                      <Bar dataKey="confirmed" stackId="a" fill={CHART_COLORS.confirmed} />
                      <Bar dataKey="completed" stackId="a" fill={CHART_COLORS.completed} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-500" />
                    Status Distribution
                  </h3>
                </div>
                <div className="h-52">
                  {statusDistributionData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      No data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #E2E8F0",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value: string) => (
                            <span className="text-xs font-medium text-slate-600">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Calendar + Selected day */}
          <div data-tour="staff-calendar" className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeMonth("prev")}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => changeMonth("next")}
                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 hover:text-slate-700 transition"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="h-7 flex items-center justify-center text-[10px] font-semibold text-slate-400 uppercase">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">
                  {toDateString(selectedDate) === toDateString(new Date())
                    ? "Today's Schedule"
                    : `${formatDate(toDateString(selectedDate))}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {getAppointmentsForDate(selectedDate).length} appointment
                  {getAppointmentsForDate(selectedDate).length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8 px-4">No appointments on this date</p>
                ) : (
                  getAppointmentsForDate(selectedDate).map((apt) => {
                    const meta = getStatusStyle(apt.status);
                    return (
                      <div
                        key={apt.id}
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowAppointmentDetails(true);
                        }}
                        className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{apt.patient_name}</p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {formatTime(apt.appointment_date)} · Dr. {apt.doctor_name}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${meta.badge} flex-shrink-0`}
                        >
                          {meta.text}
                        </span>
                      </div>
                    );
                  })
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
