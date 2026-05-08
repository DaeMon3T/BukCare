import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  Check,
  MoreVertical,
  Ban,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import ReviewModal from "@/components/ReviewModal";

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  has_reviewed?: boolean;
  doctor_avatar?: string;
  doctor_specialization?: string;
}

type FilterTab = "all" | "pending" | "confirmed" | "completed" | "expired" | "cancelled";

const STATUS_META: Record<string, { badge: string; dot: string; label: string; icon: any }> = {
  pending: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400", label: "Pending", icon: AlertCircle },
  confirmed: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Confirmed", icon: CheckCircle },
  completed: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Completed", icon: CheckCircle },
  cancelled: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-400", label: "Cancelled", icon: XCircle },
  expired: { badge: "bg-slate-100 text-slate-400 border-slate-200 italic", dot: "bg-slate-300", label: "Expired", icon: Clock },
};

const DoctorAvatar = ({ src, name }: { src?: string | null; name?: string | null }) => {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return <img src={src} alt={name || "Doctor"} className="w-10 h-10 rounded-full object-cover border border-slate-200" onError={() => setErr(true)} />;
  }
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-sm">
      {name?.charAt(0).toUpperCase() || "D"}
    </div>
  );
};

const TABS: FilterTab[] = ["all", "pending", "confirmed", "completed", "expired", "cancelled"];

const PatientAppointments = () => {
  const { lastMessage } = useWebSocket();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Meatball menu state — rendered as fixed overlay
  const [menuState, setMenuState] = useState<{ id: number; top: number; right: number } | null>(null);

  // Modals
  const [reviewAppt, setReviewAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAppointments = useCallback(async (bg = false) => {
    try {
      if (!bg) setLoading(true);
      const res = await api.get("/appointments/");
      setAppointments(res.data);
    } catch {
      if (!bg) toast.error("Failed to load appointments");
    } finally {
      if (!bg) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status } = lastMessage;
      if (appointment_id && status)
        setAppointments((p) => p.map((a) => (a.id === appointment_id ? { ...a, status } : a)));
    }
    if (lastMessage.type === "NEW_APPOINTMENT") fetchAppointments(true);
  }, [lastMessage, fetchAppointments]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenuState({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  const confirmCancel = async () => {
    if (!cancelAppt || !cancelReason.trim()) return;
    try {
      setCancelLoading(true);
      await api.put(`/appointments/${cancelAppt.id}/status`, { status: "cancelled", reason: cancelReason });
      toast.success("Appointment cancelled");
      setAppointments((p) => p.map((a) => (a.id === cancelAppt.id ? { ...a, status: "cancelled" } : a)));
      setCancelAppt(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  };

  const tabCount = (tab: FilterTab) =>
    tab === "all" ? appointments.length : appointments.filter((a) => a.status === tab).length;

  const displayed = appointments
    .filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.doctor_name?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q);
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
    const diffDays = Math.round((apt.getTime() - today.getTime()) / 86400000);
    let dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    if (diffDays === 0) dayLabel = "Today";
    else if (diffDays === 1) dayLabel = "Tomorrow";
    else if (diffDays === -1) dayLabel = "Yesterday";
    return {
      day: dayLabel,
      year: d.getFullYear().toString(),
      time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      isPast: d < new Date(),
    };
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
            className="fixed z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 overflow-hidden"
            style={{ top: menuState.top, right: menuState.right }}
          >
            {(menuAppt.status === "pending" || menuAppt.status === "confirmed") && (
              <button
                onClick={() => { setCancelAppt(menuAppt); setCancelReason(""); setMenuState(null); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
              >
                <Ban className="w-4 h-4" /> Cancel Appointment
              </button>
            )}
            {menuAppt.status === "completed" && !menuAppt.has_reviewed && (
              <button
                onClick={() => { setReviewAppt(menuAppt); setMenuState(null); }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors"
              >
                <Star className="w-4 h-4" /> Rate Doctor
              </button>
            )}
            {menuAppt.status === "completed" && menuAppt.has_reviewed && (
              <div className="px-4 py-2.5 text-sm text-slate-400 flex items-center gap-2.5">
                <Check className="w-4 h-4" /> Already Reviewed
              </div>
            )}
            {(menuAppt.status === "expired" || menuAppt.status === "cancelled") && (
              <div className="px-4 py-2.5 text-sm text-slate-400 italic">No actions available</div>
            )}
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewAppt && (
        <ReviewModal
          isOpen={!!reviewAppt}
          onClose={() => setReviewAppt(null)}
          doctorId={reviewAppt.doctor_id}
          appointmentId={reviewAppt.id}
          onSuccess={() => {
            setAppointments((p) => p.map((a) => (a.id === reviewAppt.id ? { ...a, has_reviewed: true } : a)));
            toast.success("Review submitted!");
            setReviewAppt(null);
          }}
        />
      )}

      {/* Cancel Modal */}
      {cancelAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-rose-50 p-6 flex flex-col items-center text-center border-b border-rose-100">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
              <p className="text-sm text-slate-500 mt-1.5">
                With <span className="font-semibold text-slate-700">Dr. {cancelAppt.doctor_name}</span>
              </p>
            </div>
            <div className="p-5 space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reason</label>
              <textarea
                className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none resize-none bg-slate-50"
                rows={3} autoFocus
                placeholder="e.g. Scheduling conflict, feeling better..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button onClick={() => setCancelAppt(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50">Keep it</button>
              <button
                onClick={confirmCancel}
                disabled={cancelLoading || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {displayed.length} of {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text" placeholder="Search doctor, reason..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-52"
              />
            </div>
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
            >
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
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 border transition-all ${active
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? "bg-white/20 text-white" :
                    tab === "pending" ? "bg-amber-100 text-amber-700" :
                      tab === "expired" ? "bg-slate-100 text-slate-500" :
                        "bg-slate-100 text-slate-600"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center text-center shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">No appointments found</h3>
            <p className="text-slate-500 text-sm mt-1">
              {filter === "all" ? "You haven't booked any appointments yet." : `No ${filter} appointments.`}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                    <th className="py-3.5 px-5">Doctor</th>
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
                        {/* Doctor */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <DoctorAvatar src={appt.doctor_avatar} name={appt.doctor_name} />
                            <div>
                              <p className="font-semibold text-sm text-slate-900">Dr. {appt.doctor_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {appt.doctor_specialization?.replace(/[\[\]"]/g, "") || "General Practice"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className={`text-sm font-semibold ${isPast && !["completed", "cancelled", "expired"].includes(appt.status) ? "text-slate-400" : "text-slate-800"}`}>
                            {day}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{year} · {time}</p>
                        </td>

                        {/* Reason */}
                        <td className="py-4 px-4 max-w-[220px]">
                          <p className="text-sm text-slate-600 truncate flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                            {appt.reason || <span className="italic text-slate-400">No reason</span>}
                          </p>
                          {appt.notes && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mt-1 truncate">
                              Note: {appt.notes}
                            </p>
                          )}
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
                        <td className="py-4 px-4 relative text-right">
                          <button
                            onClick={(e) => openMenu(e, appt.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all"
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
                        <DoctorAvatar src={appt.doctor_avatar} name={appt.doctor_name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">Dr. {appt.doctor_name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {appt.doctor_specialization?.replace(/[\[\]"]/g, "") || "General Practice"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => openMenu(e, appt.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Schedule</span>
                        <span className="font-semibold text-slate-800">{day}, {year} · {time}</span>
                      </div>
                      {appt.reason && (
                        <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200">
                          <FileText className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />
                          <span className="italic">{appt.reason}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
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
      </main>
    </div>
  );
};

export default PatientAppointments;
