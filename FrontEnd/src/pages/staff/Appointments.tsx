import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  Search,
  Eye,
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";

interface Appointment {
  id: number;
  patient_name: string;
  patient_id: number;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  appointment_type?: "online" | "walk_in";
  created_at: string;
  updated_at: string;
  patient_avatar?: string;
}

const StaffAppointments = () => {
  const { lastMessage } = useWebSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "status">("date_desc");
  const [searchTerm, setSearchTerm] = useState("");

  // FETCH APPOINTMENTS
  const fetchAppointments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await api.get("/appointments/doctor");
      setAppointments(response.data);
    } catch (err: any) {
      console.error("Failed to load appointments:", err);
      if (!isBackground) toast.error("Failed to load appointments");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // WEBSOCKET LISTENER
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "NEW_APPOINTMENT") fetchAppointments(true);
    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status, new_date } = lastMessage;
      if (appointment_id && status) {
        setAppointments((prev) =>
          prev.map((appt) => (appt.id === appointment_id ? { ...appt, status } : appt))
        );
      }
      if (new_date) fetchAppointments(true);
    }
    if (lastMessage.type === "APPOINTMENT_DELETED") {
      if (lastMessage.appointment_id) {
        setAppointments((prev) => prev.filter((appt) => appt.id !== lastMessage.appointment_id));
      }
    }
  }, [lastMessage, fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // FILTER & SORT
  const filteredAppointments = appointments
    .filter((appt) => {
      if (filter !== "all" && appt.status !== filter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          appt.patient_name.toLowerCase().includes(term) ||
          appt.doctor_name?.toLowerCase().includes(term) ||
          appt.reason?.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
      if (sortBy === "date_asc") return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      isPast: date < new Date(),
    };
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending": return { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, label: "Pending" };
      case "confirmed": return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Confirmed" };
      case "completed": return { badge: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle, label: "Completed" };
      case "cancelled": return { badge: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" };
      case "expired": return { badge: "bg-gray-50 text-gray-400 border-gray-100 italic", icon: Clock, label: "Expired" };
      default: return { badge: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: status };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">All Appointments</h2>
            <p className="text-slate-500 mt-1">Monitor appointment statuses across all doctors</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Read-Only Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">View Only</span>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 shadow-sm w-48"
              />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 scrollbar-hide">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => {
            const count = f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
                  isActive
                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">No appointments found</h3>
            <p className="text-slate-500">There are no {filter !== "all" ? filter : ""} appointments to display</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-400 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-black font-bold tracking-wider text-left">
                    <th className="py-4 px-6">Patient</th>
                    <th className="py-4 px-6">Doctor</th>
                    <th className="py-4 px-6">Schedule</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {filteredAppointments.map((appt) => {
                    const { date, time, isPast } = formatDateTime(appt.appointment_date);
                    const statusStyle = getStatusStyles(appt.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <tr key={appt.id} className="group hover:bg-teal-50/30 transition-colors">
                        {/* Patient */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold shadow-sm">
                              {appt.patient_avatar ? (
                                <img src={appt.patient_avatar} alt={appt.patient_name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                              <p className="text-xs text-slate-500">ID: {appt.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        {/* Doctor */}
                        <td className="py-5 px-6">
                          <p className="text-sm font-medium text-slate-700">{appt.doctor_name}</p>
                        </td>
                        {/* Schedule */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isPast ? "text-slate-400" : "text-slate-800"}`}>{date}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs font-medium text-slate-500">{time}</span>
                            </div>
                          </div>
                        </td>
                        {/* Reason */}
                        <td className="py-5 px-6 max-w-[200px]">
                          <p className="text-sm text-slate-600 truncate">{appt.reason || <span className="italic text-slate-400">No reason</span>}</p>
                        </td>
                        {/* Status + Type */}
                        <td className="py-5 px-6">
                            <div className="flex flex-col gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${statusStyle.badge}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusStyle.label}
                              </span>
                              {appt.appointment_type === 'walk_in' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200 w-fit">
                                     Walk-in
                                  </span>
                              ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200 w-fit">
                                     Online
                                  </span>
                              )}
                            </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredAppointments.map((appt) => {
                const { date, time } = formatDateTime(appt.appointment_date);
                const statusStyle = getStatusStyles(appt.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                          {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                          <p className="text-xs text-slate-500">Dr. {appt.doctor_name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}>
                        <StatusIcon className="w-3 h-3" /> {statusStyle.label}
                      </span>
                    </div>
                    <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-semibold text-slate-900">{date}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Time:</span>
                        <span className="font-semibold text-slate-900">{time}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <p className="text-xs text-slate-500 italic">"{appt.reason || "No reason provided"}"</p>
                      </div>
                    </div>
                    {/* Type badge */}
                    <div className="mt-3 flex items-center gap-2">
                      {appt.appointment_type === 'walk_in' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-700 border-purple-200">Walk-in</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">Online</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StaffAppointments;
