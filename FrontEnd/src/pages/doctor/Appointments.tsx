import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  Clock, CheckCircle, XCircle, AlertCircle, Calendar,
  User, Trash2, RefreshCw, UserPlus, Check, AlertTriangle,
  MoreVertical, Search, Video,
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import RescheduleModal from "@/components/RescheduleModal";
import FollowUpModal from "@/components/FollowUpModal";
import ConsultationNotesModal from "@/components/ConsultationNotesModal";
import messagesAPI from "@/services/messages";

interface Appointment {
  id: number;
  patient_name: string;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient_avatar?: string;
}

type FilterTab = "all" | "pending" | "confirmed" | "completed" | "expired" | "cancelled";

const STATUS_META: Record<string, { badge: string; label: string; icon: any }> = {
  pending: { badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending", icon: AlertCircle },
  confirmed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Confirmed", icon: CheckCircle },
  completed: { badge: "bg-blue-50 text-blue-700 border-blue-200", label: "Completed", icon: CheckCircle },
  cancelled: { badge: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled", icon: XCircle },
  expired: { badge: "bg-slate-100 text-slate-400 border-slate-200 italic", label: "Expired", icon: Clock },
};

const TABS: FilterTab[] = ["all", "pending", "confirmed", "completed", "expired", "cancelled"];

const DoctorAppointments = () => {
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const isStaff = (user?.role || "") === "staff";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Meatball menu
  const [menuState, setMenuState] = useState<{ id: number; top: number; right: number } | null>(null);

  // Modal states
  const [rescheduleData, setRescheduleData] = useState<{ id: number; date: string } | null>(null);
  const [followUpData, setFollowUpData] = useState<{ patientId: number; name: string } | null>(null);
  const [completeData, setCompleteData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchAppointments = useCallback(async (bg = false) => {
    try {
      if (!bg) setLoading(true);
      const res = await api.get("/appointments/doctor");
      setAppointments(res.data);
    } catch {
      if (!bg) toast.error("Failed to load appointments");
    } finally {
      if (!bg) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "NEW_APPOINTMENT") fetchAppointments(true);
    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status, new_date } = lastMessage;
      if (appointment_id && status)
        setAppointments((p) => p.map((a) => (a.id === appointment_id ? { ...a, status } : a)));
      if (new_date) fetchAppointments(true);
    }
    if (lastMessage.type === "APPOINTMENT_DELETED") {
      if (lastMessage.appointment_id)
        setAppointments((p) => p.filter((a) => a.id !== lastMessage.appointment_id));
    }
  }, [lastMessage, fetchAppointments]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const updateStatus = async (id: number, newStatus: "confirmed" | "completed") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(newStatus === "confirmed" ? "Appointment confirmed" : "Marked as completed");
      setAppointments((p) => p.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Action failed");
    }
  };

  const confirmCancel = async () => {
    if (!cancelData || !cancelReason.trim()) return;
    try {
      setCancelLoading(true);
      await api.put(`/appointments/${cancelData.id}/status`, { status: "cancelled", reason: cancelReason });
      toast.success("Appointment cancelled");
      setAppointments((p) => p.map((a) => (a.id === cancelData.id ? { ...a, status: "cancelled" } : a)));
      setCancelData(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  };

  const deleteAppointment = async (id: number) => {
    try {
      await api.delete(`/appointments/${id}/permanent`);
      toast.success("Record deleted");
      setDeleteTarget(null);
      setAppointments((p) => p.filter((a) => a.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete");
    }
  };

  const startVideoCall = async (appt: Appointment) => {
    if (!user) return;
    const id1 = Math.min(Number(user.id), appt.patient_id);
    const id2 = Math.max(Number(user.id), appt.patient_id);
    const roomId = `BukCare_Consult_${id1}_${id2}_${Date.now()}`;
    try {
      await messagesAPI.sendMessage(appt.patient_id, `📞 Started a Video Call. Join here: ${roomId}`);
      window.open(`https://meet.jit.si/${roomId}`, "_blank");
      toast.success("Video call started — patient notified");
    } catch {
      toast.error("Failed to start video call");
    }
  };

  const tabCount = (tab: FilterTab) =>
    tab === "all" ? appointments.length : appointments.filter((a) => a.status === tab).length;

  const displayed = appointments
    .filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.patient_name.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      return sortDir === "desc" ? -diff : diff;
    });

  const fmt = (s: string) => {
    const d = new Date(s);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const apt = new Date(d); apt.setHours(0, 0, 0, 0);
    const diff = Math.round((apt.getTime() - today.getTime()) / 86400000);
    let day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (diff === 0) day = "Today";
    else if (diff === 1) day = "Tomorrow";
    else if (diff === -1) day = "Yesterday";
    return { day, year: d.getFullYear().toString(), time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }), isPast: d < new Date(), displayString: d.toLocaleString() };
  };

  const menuAppt = menuState ? appointments.find((a) => a.id === menuState.id) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      {/* Fixed meatball menu portal */}
      {menuState && menuAppt && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuState(null)} />
          <div
            className="fixed z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden"
            style={{ top: menuState.top, right: menuState.right }}
          >
            {!isStaff && menuAppt.status === "pending" && (
              <>
                <button onClick={() => { updateStatus(menuAppt.id, "confirmed"); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors">
                  <Check className="w-4 h-4" /> Confirm
                </button>
                <button onClick={() => { setRescheduleData({ id: menuAppt.id, date: fmt(menuAppt.appointment_date).displayString }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Reschedule
                </button>
                <button onClick={() => { setCancelData({ id: menuAppt.id, patientName: menuAppt.patient_name }); setCancelReason(""); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
            {!isStaff && menuAppt.status === "confirmed" && (
              <>
                {new Date(menuAppt.appointment_date) <= new Date() && (
                  <button onClick={() => { setCompleteData({ id: menuAppt.id, patientName: menuAppt.patient_name }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors">
                    <CheckCircle className="w-4 h-4" /> Complete
                  </button>
                )}
                {menuAppt.appointment_type !== "walk_in" && (
                  <button onClick={() => { startVideoCall(menuAppt); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors">
                    <Video className="w-4 h-4" /> Video Call
                  </button>
                )}
                <button onClick={() => { setRescheduleData({ id: menuAppt.id, date: fmt(menuAppt.appointment_date).displayString }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Reschedule
                </button>
                <button onClick={() => { setCancelData({ id: menuAppt.id, patientName: menuAppt.patient_name }); setCancelReason(""); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </>
            )}
            {!isStaff && menuAppt.status === "completed" && (
              <>
                <button onClick={() => { setFollowUpData({ patientId: menuAppt.patient_id, name: menuAppt.patient_name }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors">
                  <UserPlus className="w-4 h-4" /> Follow-Up
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button onClick={() => { setDeleteTarget(menuAppt.id); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                  <Trash2 className="w-4 h-4" /> Delete Record
                </button>
              </>
            )}
            {!isStaff && (menuAppt.status === "cancelled" || menuAppt.status === "expired") && (
              <button onClick={() => { setDeleteTarget(menuAppt.id); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Record
              </button>
            )}
            {isStaff && (
              <div className="px-4 py-3 text-sm text-slate-400 italic">View only</div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <RescheduleModal
        isOpen={!!rescheduleData}
        onClose={() => setRescheduleData(null)}
        appointmentId={rescheduleData?.id || 0}
        currentDate={rescheduleData?.date || ""}
        onSuccess={() => { fetchAppointments(); setRescheduleData(null); }}
      />
      <FollowUpModal
        isOpen={!!followUpData}
        onClose={() => setFollowUpData(null)}
        patientId={followUpData?.patientId || 0}
        patientName={followUpData?.name || ""}
        onSuccess={() => { fetchAppointments(); setFollowUpData(null); }}
      />
      <ConsultationNotesModal
        isOpen={!!completeData}
        onClose={() => setCompleteData(null)}
        patientName={completeData?.patientName || ""}
        onSubmit={async (notes) => {
          if (!completeData) return;
          await api.put(`/appointments/${completeData.id}/status`, { status: "completed", notes: notes || undefined });
          toast.success("Appointment completed");
          setAppointments((p) => p.map((a) => (a.id === completeData.id ? { ...a, status: "completed", notes: notes || a.notes } : a)));
          setCompleteData(null);
        }}
      />

      {/* Cancel Modal */}
      {cancelData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-rose-50 p-6 flex flex-col items-center text-center border-b border-rose-100">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
              <p className="text-sm text-slate-500 mt-1.5">With <span className="font-semibold text-slate-700">{cancelData.patientName}</span></p>
            </div>
            <div className="p-5 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
              <textarea className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none resize-none" rows={3} autoFocus placeholder="e.g. Unforeseen emergency..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setCancelData(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Go Back</button>
              <button onClick={confirmCancel} disabled={cancelLoading || !cancelReason.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50">
                {cancelLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><Trash2 className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Record?</h3>
            <p className="text-sm text-slate-500 mb-6">This permanently removes the appointment record and cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => deleteAppointment(deleteTarget)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {displayed.length} of {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search patient, reason..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-52"
              />
            </div>
            <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {sortDir === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-1 gap-1.5 mb-6 scrollbar-hide">
          {TABS.map((tab) => {
            const count = tabCount(tab);
            const active = filter === tab;
            return (
              <button key={tab} onClick={() => setFilter(tab)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${active ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20 text-white" : tab === "pending" ? "bg-amber-100 text-amber-700" : tab === "expired" ? "bg-slate-100 text-slate-500" : "bg-slate-100 text-slate-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />)}</div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Calendar className="w-7 h-7 text-slate-300" /></div>
            <h3 className="text-lg font-semibold text-slate-800">No appointments found</h3>
            <p className="text-slate-500 text-sm mt-1">No {filter !== "all" ? filter : ""} appointments to display</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="py-3.5 px-5">Patient</th>
                    <th className="py-3.5 px-4 cursor-pointer hover:text-slate-700" onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}>
                      Date & Time {sortDir === "desc" ? "↓" : "↑"}
                    </th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayed.map((appt) => {
                    const { day, year, time, isPast } = fmt(appt.appointment_date);
                    const meta = STATUS_META[appt.status] || STATUS_META.pending;
                    const StatusIcon = meta.icon;

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Patient */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 overflow-hidden flex-shrink-0">
                              {appt.patient_avatar
                                ? <img src={appt.patient_avatar} alt={appt.patient_name} className="w-full h-full object-cover" />
                                : <User className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{appt.patient_name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">#{appt.patient_id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${isPast && !["completed", "cancelled", "expired"].includes(appt.status) ? "text-slate-400" : "text-slate-800"}`}>{day}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{year} · {time}</p>
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-4 max-w-[220px]">
                          <p className="text-sm text-slate-600 truncate">{appt.reason || <span className="italic text-slate-400">No reason</span>}</p>
                          {appt.notes && <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mt-1 truncate">Note: {appt.notes}</p>}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${meta.badge}`}>
                              <StatusIcon className="w-3 h-3" /> {meta.label}
                            </span>
                          </div>
                        </td>

                        {/* Meatball */}
                        <td className="py-4 px-4 text-right">
                          <button onClick={(e) => openMenu(e, appt.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {displayed.map((appt) => {
                const { day, year, time } = fmt(appt.appointment_date);
                const meta = STATUS_META[appt.status] || STATUS_META.pending;
                const StatusIcon = meta.icon;

                return (
                  <div key={appt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 overflow-hidden">
                          {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{appt.patient_name}</p>
                          <p className="text-xs text-slate-400">#{appt.patient_id}</p>
                        </div>
                      </div>
                      <button onClick={(e) => openMenu(e, appt.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Schedule</span>
                        <span className="font-semibold text-slate-800">{day}, {year} · {time}</span>
                      </div>
                      {appt.reason && (
                        <div className="text-xs text-slate-500 italic pt-1 border-t border-slate-200 truncate">{appt.reason}</div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
                        <StatusIcon className="w-3 h-3" /> {meta.label}
                      </span>
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

export default DoctorAppointments;
