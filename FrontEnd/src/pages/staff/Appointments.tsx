import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import {
  Clock, CheckCircle, XCircle, AlertCircle, Calendar, User,
  Trash2, RefreshCw, Check, AlertTriangle, MoreVertical, Search,
  Eye, ArrowUpDown, Info, ChevronDown,
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import StaffAccessAPI from "@/services/staff/StaffAccessAPI";
import type { DoctorAccessRecord } from "@/services/staff/StaffAccessAPI";
import RescheduleModal from "@/components/RescheduleModal";
import ConsultationNotesModal from "@/components/ConsultationNotesModal";

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

const StaffAppointments = () => {
  const { lastMessage } = useWebSocket();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [accessRecords, setAccessRecords] = useState<DoctorAccessRecord[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  const permissionMap = useMemo(
    () => Object.fromEntries(accessRecords.map((r) => [r.doctor_id, r])),
    [accessRecords]
  );
  const hasAnyAccess = accessRecords.length > 0;
  const hasAnyManage = accessRecords.some((r) => r.can_manage_appointments);
  const headerBadge = useMemo(() => {
    if (permissionsLoading) return null;
    if (!hasAnyAccess) return { label: "No Access", cls: "bg-rose-50 border-rose-200 text-rose-600" };
    if (hasAnyManage) return null;
    if (accessRecords.some((r) => r.can_book_walkins || r.can_register_patients))
      return { label: "Receptionist", cls: "bg-blue-50 border-blue-200 text-blue-600" };
    return { label: "Observer", cls: "bg-slate-100 border-slate-200 text-slate-500" };
  }, [permissionsLoading, hasAnyAccess, hasAnyManage, accessRecords]);

  // Meatball menu
  const [menuState, setMenuState] = useState<{ id: number; top: number; right: number } | null>(null);

  // Modal states
  const [rescheduleData, setRescheduleData] = useState<{ id: number; date: string } | null>(null);
  const [completeData, setCompleteData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    setPermissionsLoading(true);
    StaffAccessAPI.getMyDoctors()
      .then(setAccessRecords)
      .catch(() => toast.error("Could not load your permissions. Please refresh."))
      .finally(() => setPermissionsLoading(false));
  }, []);

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

  const canManage = (doctorId: number) => !!permissionMap[doctorId]?.can_manage_appointments;

  const getAccessLabel = (doctorId: number) => {
    const rec = permissionMap[doctorId];
    if (!rec) return { label: "No Access", color: "text-slate-400" };
    if (rec.can_manage_appointments) return { label: "Full Access", color: "text-emerald-600" };
    if (rec.can_book_walkins || rec.can_register_patients) return { label: "Receptionist", color: "text-blue-500" };
    return { label: "Observer", color: "text-slate-500" };
  };

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const updateStatus = async (id: number, newStatus: "confirmed") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success("Appointment confirmed");
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

  const tabCount = (tab: FilterTab) =>
    tab === "all" ? appointments.length : appointments.filter((a) => a.status === tab).length;

  const displayed = appointments
    .filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.patient_name.toLowerCase().includes(q) || a.doctor_name?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q);
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
  const menuCanManage = menuAppt ? canManage(menuAppt.doctor_id) : false;

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
            {!menuCanManage ? (
              <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2"><Eye className="w-4 h-4" /> View only</div>
            ) : (
              <>
                {menuAppt.status === "pending" && (
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
                {menuAppt.status === "confirmed" && (
                  <>
                    {new Date(menuAppt.appointment_date) <= new Date() && (
                      <button onClick={() => { setCompleteData({ id: menuAppt.id, patientName: menuAppt.patient_name }); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 flex items-center gap-2.5 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Complete
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
                {(menuAppt.status === "completed" || menuAppt.status === "cancelled" || menuAppt.status === "expired") && (
                  <button onClick={() => { setDeleteTarget(menuAppt.id); setMenuState(null); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors">
                    <Trash2 className="w-4 h-4" /> Delete Record
                  </button>
                )}
              </>
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
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600"><AlertTriangle className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
              <p className="text-sm text-slate-500 mt-1.5">For <span className="font-semibold text-slate-700">{cancelData.patientName}</span></p>
            </div>
            <div className="p-5 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Reason</label>
              <textarea className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none resize-none" rows={3} autoFocus placeholder="e.g. Rescheduled by doctor..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
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
            <p className="text-sm text-slate-500 mb-6">This permanently removes the appointment record.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600">Cancel</button>
              <button onClick={() => deleteAppointment(deleteTarget)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">Delete</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* No-access banner — promoted to top of page so it's the first thing seen */}
        {!permissionsLoading && !hasAnyAccess && (
          <div className="mb-5 sm:mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-900">No assigned doctors yet</p>
              <p className="text-xs sm:text-sm text-amber-800/80 mt-0.5">
                Ask a doctor to grant you access from their <span className="font-semibold">Manage Staff</span> page.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Title + meta */}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Appointments</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-slate-500">
                  {displayed.length} of {appointments.length}
                </span>
                {headerBadge && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-[11px] font-semibold ${headerBadge.cls}`}>
                      <Eye className="w-3 h-3" /> {headerBadge.label}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions — full-width on mobile, right-aligned on desktop */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, reason…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-300 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex-shrink-0"
                title={sortDir === "desc" ? "Newest first" : "Oldest first"}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">{sortDir === "desc" ? "Newest" : "Oldest"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Filter Tabs — minimal underline style */}
        <div className="border-b border-slate-200 -mx-4 sm:mx-0 px-4 sm:px-0 mb-5 sm:mb-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => {
              const count = tabCount(tab);
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                    active
                      ? "border-teal-600 text-teal-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      active ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 sm:h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 sm:p-16 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6 text-slate-300" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No appointments found</h3>
            <p className="text-slate-500 text-sm mt-1">
              {search ? "Try a different search term" : `No ${filter !== "all" ? filter : ""} appointments to display`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="py-3 px-5">Patient</th>
                    <th className="py-3 px-4">Doctor</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-slate-700 select-none"
                      onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
                    >
                      <span className="inline-flex items-center gap-1">
                        Date & Time
                        <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === "asc" ? "rotate-180" : ""}`} />
                      </span>
                    </th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayed.map((appt) => {
                    const { day, year, time, isPast } = fmt(appt.appointment_date);
                    const meta = STATUS_META[appt.status] || STATUS_META.pending;
                    const StatusIcon = meta.icon;
                    const managed = canManage(appt.doctor_id);
                    const accessInfo = getAccessLabel(appt.doctor_id);

                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 overflow-hidden flex-shrink-0">
                              {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-slate-900 truncate">{appt.patient_name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">#{appt.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{appt.doctor_name}</p>
                          {!managed && (
                            <span className={`text-[10px] font-medium ${accessInfo.color}`}>{accessInfo.label}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${isPast && !["completed", "cancelled", "expired"].includes(appt.status) ? "text-slate-400" : "text-slate-800"}`}>{day}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{year} · {time}</p>
                        </td>
                        <td className="py-3.5 px-4 max-w-[220px]">
                          <p className="text-sm text-slate-600 truncate">{appt.reason || <span className="italic text-slate-400">No reason</span>}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${meta.badge}`}>
                            <StatusIcon className="w-3 h-3" /> {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={(e) => openMenu(e, appt.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                            aria-label="Open actions menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards — flat, list-like, info-dense */}
            <div className="md:hidden space-y-2">
              {displayed.map((appt) => {
                const { day, time, isPast } = fmt(appt.appointment_date);
                const meta = STATUS_META[appt.status] || STATUS_META.pending;
                const StatusIcon = meta.icon;
                const managed = canManage(appt.doctor_id);
                const accessInfo = getAccessLabel(appt.doctor_id);

                return (
                  <div key={appt.id} className="bg-white rounded-xl border border-slate-200 p-3.5">
                    {/* Top row: avatar + name + status + menu */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0 overflow-hidden">
                        {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full object-cover" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-slate-900 truncate">{appt.patient_name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${meta.badge}`}>
                            <StatusIcon className="w-2.5 h-2.5" /> {meta.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <p className="text-xs text-slate-500 truncate">{appt.doctor_name}</p>
                          {!managed && (
                            <span className={`text-[10px] font-medium ${accessInfo.color}`}>· {accessInfo.label}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => openMenu(e, appt.id)}
                        className="p-1 -m-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0"
                        aria-label="Open actions menu"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom row: date + reason */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Clock className={`w-3 h-3 ${isPast ? "text-slate-300" : "text-slate-400"}`} />
                        <span className={`font-medium ${isPast ? "text-slate-400" : "text-slate-700"}`}>{day} · {time}</span>
                      </div>
                      {appt.reason && (
                        <>
                          <span className="text-slate-200">|</span>
                          <p className="text-slate-500 truncate">{appt.reason}</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StaffAppointments;
