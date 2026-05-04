import { useEffect, useState, useCallback, useMemo } from "react";
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
  RefreshCw,
  Check,
  AlertTriangle,
  Search,
  Download,
  Bell,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import RescheduleModal from "@/components/RescheduleModal";

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
  created_at: string;
  updated_at: string;
  patient_avatar?: string;
}

type SortKey = "date" | "patient" | "doctor" | "status";
type SortDir = "asc" | "desc";
type FilterTab = "all" | "pending" | "confirmed" | "completed" | "expired" | "cancelled";

const STATUS_ORDER: Record<string, number> = { pending: 0, confirmed: 1, completed: 2, cancelled: 3, expired: 4 };

const AdminAppointments = () => {
  const { lastMessage } = useWebSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingReminders, setSendingReminders] = useState(false);

  // Meatball menu
  const [menuState, setMenuState] = useState<{ id: number; top: number; right: number } | null>(null);

  const [rescheduleData, setRescheduleData] = useState<{ id: number; date: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelProcessing, setCancelProcessing] = useState(false);

  const fetchAppointments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await api.get("/appointments/doctor");
      setAppointments(response.data);
    } catch (err: any) {
      if (!isBackground) toast.error("Failed to load appointments");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "NEW_APPOINTMENT") fetchAppointments(true);
    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status } = lastMessage;
      if (appointment_id && status) {
        setAppointments((prev) => prev.map((a) => (a.id === appointment_id ? { ...a, status } : a)));
      }
      if (lastMessage.new_date) fetchAppointments(true);
    }
    if (lastMessage.type === "APPOINTMENT_DELETED") {
      if (lastMessage.appointment_id)
        setAppointments((prev) => prev.filter((a) => a.id !== lastMessage.appointment_id));
    }
  }, [lastMessage, fetchAppointments]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const updateStatus = async (id: number, newStatus: "confirmed" | "completed") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Action failed");
    }
  };

  const openCancelModal = (id: number, patientName: string) => {
    setCancelData({ id, patientName });
    setCancellationReason("");
  };

  const confirmCancellation = async () => {
    if (!cancelData || !cancellationReason.trim()) return;
    try {
      setCancelProcessing(true);
      await api.put(`/appointments/${cancelData.id}/status`, { status: "cancelled", reason: cancellationReason });
      toast.success("Appointment cancelled");
      setAppointments((prev) => prev.map((a) => (a.id === cancelData.id ? { ...a, status: "cancelled" } : a)));
      setCancelData(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancelProcessing(false);
    }
  };

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const res = await api.post("/appointments/reminders/send");
      toast.success(res.data.message || "Reminders sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["ID", "Patient", "Doctor", "Date", "Time", "Type", "Status", "Reason"],
      ...filteredAppointments.map((a) => {
        const d = new Date(a.appointment_date);
        return [
          a.id,
          a.patient_name,
          a.doctor_name,
          d.toLocaleDateString(),
          d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          a.status,
          a.reason || "",
        ];
      }),
    ]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointments_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        if (filter !== "all" && a.status !== filter) return false;
        if (searchTerm) {
          const t = searchTerm.toLowerCase();
          return (
            a.patient_name.toLowerCase().includes(t) ||
            a.doctor_name?.toLowerCase().includes(t) ||
            a.reason?.toLowerCase().includes(t)
          );
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
        else if (sortKey === "patient") cmp = a.patient_name.localeCompare(b.patient_name);
        else if (sortKey === "doctor") cmp = a.doctor_name.localeCompare(b.doctor_name);
        else if (sortKey === "status") cmp = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [appointments, filter, searchTerm, sortKey, sortDir]);

  const menuAppt = menuState ? appointments.find((a) => a.id === menuState.id) : null;

  const counts = useMemo(() => ({
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    expired: appointments.filter((a) => a.status === "expired").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  }), [appointments]);

  const formatDateTime = (s: string) => {
    const d = new Date(s);
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      displayString: `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      isPast: d < new Date(),
    };
  };

  const getStatusStyles = (s: string) => {
    switch (s) {
      case "pending": return { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, label: "Pending" };
      case "confirmed": return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Confirmed" };
      case "completed": return { badge: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle, label: "Completed" };
      case "cancelled": return { badge: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" };
      case "expired": return { badge: "bg-gray-50 text-gray-400 border-gray-100 italic", icon: Clock, label: "Expired" };
      default: return { badge: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: s };
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1 opacity-30" />
    );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Reschedule Modal */}
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          appointmentId={rescheduleData?.id || 0}
          currentDate={rescheduleData?.date || ""}
          onSuccess={() => { fetchAppointments(); setRescheduleData(null); }}
        />

        {/* Cancel Modal */}
        {cancelData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-rose-50 p-6 flex flex-col items-center text-center border-b border-rose-100">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
                <p className="text-sm text-slate-500 mt-2">
                  Cancelling appointment for <span className="font-bold text-slate-700">{cancelData.patientName}</span>.
                </p>
              </div>
              <div className="p-4 space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Reason for Cancellation</label>
                <textarea
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none resize-none"
                  rows={3}
                  placeholder="e.g. System requirement, policy..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-4 flex gap-3 pt-0">
                <button onClick={() => setCancelData(null)} disabled={cancelProcessing} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200">Go Back</button>
                <button
                  onClick={confirmCancellation}
                  disabled={cancelProcessing || !cancellationReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Appointments</h2>
            <p className="text-slate-500 mt-1 font-medium">
              Showing <span className="font-bold text-slate-700">{filteredAppointments.length}</span> of{" "}
              <span className="font-bold text-slate-700">{appointments.length}</span> appointments
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, doctor, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm w-52"
              />
            </div>
            {/* Reminder Button */}
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-60"
              title="Send 24h reminder emails for upcoming confirmed appointments"
            >
              {sendingReminders ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              Send Reminders
            </button>
            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Fixed meatball menu portal */}
        {menuState && menuAppt && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuState(null)} />
            <div className="fixed z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden" style={{ top: menuState.top, right: menuState.right }}>
              {menuAppt.status === "pending" && (
                <>
                  <button onClick={() => { updateStatus(menuAppt.id, "confirmed"); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors">
                    <Check className="w-4 h-4" /> Confirm
                  </button>
                  <button onClick={() => { setRescheduleData({ id: menuAppt.id, date: formatDateTime(menuAppt.appointment_date).displayString }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Reschedule
                  </button>
                  <button onClick={() => { openCancelModal(menuAppt.id, menuAppt.patient_name); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {menuAppt.status === "confirmed" && (
                <>
                  <button onClick={() => { updateStatus(menuAppt.id, "completed"); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Complete
                  </button>
                  <button onClick={() => { setRescheduleData({ id: menuAppt.id, date: formatDateTime(menuAppt.appointment_date).displayString }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Reschedule
                  </button>
                  <button onClick={() => { openCancelModal(menuAppt.id, menuAppt.patient_name); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
              {(menuAppt.status === "completed" || menuAppt.status === "cancelled" || menuAppt.status === "expired") && (
                <div className="px-4 py-2.5 text-sm text-slate-400 italic">No further actions</div>
              )}
            </div>
          </>
        )}

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 scrollbar-hide">
          {(["all", "pending", "confirmed", "completed", "expired", "cancelled"] as const).map((f) => {
            const count = counts[f as keyof typeof counts];
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border ${isActive
                    ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                  }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : f === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">No appointments found</h3>
            <p className="text-slate-500">Try changing filters or search terms</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider text-left">
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 select-none" onClick={() => handleSort("patient")}>
                      Patient <SortIcon col="patient" />
                    </th>
                    <th className="py-4 px-5 cursor-pointer hover:text-slate-800 select-none" onClick={() => handleSort("doctor")}>
                      Doctor <SortIcon col="doctor" />
                    </th>
                    <th className="py-4 px-5 cursor-pointer hover:text-slate-800 select-none" onClick={() => handleSort("date")}>
                      Schedule <SortIcon col="date" />
                    </th>
                    <th className="py-4 px-5 max-w-[200px]">Reason</th>
                    <th className="py-4 px-5 cursor-pointer hover:text-slate-800 select-none" onClick={() => handleSort("status")}>
                      Status <SortIcon col="status" />
                    </th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const { date, time, displayString, isPast } = formatDateTime(appt.appointment_date);
                    const s = getStatusStyles(appt.status);
                    const StatusIcon = s.icon;

                    return (
                      <tr key={appt.id} className="group hover:bg-slate-50/80 transition-colors">
                        {/* Patient */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 flex items-center justify-center text-blue-600 overflow-hidden flex-shrink-0">
                              {appt.patient_avatar ? (
                                <img src={appt.patient_avatar} alt={appt.patient_name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                              <p className="text-xs text-blue-500 font-semibold">#{appt.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        {/* Doctor */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold border border-emerald-100 flex-shrink-0">Dr</div>
                            <p className="text-sm font-semibold text-slate-700">{appt.doctor_name}</p>
                          </div>
                        </td>
                        {/* Schedule */}
                        <td className="py-4 px-5">
                          <p className={`text-sm font-bold ${isPast ? "text-slate-400" : "text-slate-800"}`}>{date}</p>
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3" /> {time}
                          </span>
                        </td>
                        {/* Reason */}
                        <td className="py-4 px-5 max-w-[200px]">
                          <p className="text-sm text-slate-600 truncate" title={appt.reason || ""}>
                            {appt.reason || <span className="italic text-slate-400">No reason</span>}
                          </p>
                        </td>
                        {/* Status */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.badge}`}>
                            <StatusIcon className="w-3.5 h-3.5" /> {s.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {(appt.status === "pending" || appt.status === "confirmed") ? (
                            <button onClick={(e) => openMenu(e, appt.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic px-2">{appt.status === "completed" ? "Done" : appt.status === "expired" ? "Expired" : "Cancelled"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredAppointments.map((appt) => {
                const { date, time } = formatDateTime(appt.appointment_date);
                const s = getStatusStyles(appt.status);
                const StatusIcon = s.icon;

                return (
                  <div key={appt.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                          {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full rounded-xl object-cover" /> : <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{appt.patient_name}</p>
                          <p className="text-xs text-slate-500 truncate">Dr. {appt.doctor_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${s.badge}`}>
                          <StatusIcon className="w-3 h-3" /> {s.label}
                        </span>
                        {(appt.status === "pending" || appt.status === "confirmed") && (
                          <button onClick={(e) => openMenu(e, appt.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-sm border border-slate-100">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Date</span>
                        <span className="font-semibold text-slate-800">{date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Time</span>
                        <span className="font-semibold text-slate-800">{time}</span>
                      </div>
                      {appt.reason && <p className="text-xs italic text-slate-500 border-t border-slate-200 pt-2 mt-2 truncate">"{appt.reason}"</p>}
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

export default AdminAppointments;
