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
  RefreshCw,
  Check,
  AlertTriangle,
  ArrowUpDown,
  Search,
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
  appointment_type?: "online" | "walk_in";
}

const AdminAppointments = () => {
  const { lastMessage } = useWebSocket();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "status">("date_desc");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [rescheduleData, setRescheduleData] = useState<{ id: number; date: string } | null>(null);
  const [cancelData, setCancelData] = useState<{ id: number; patientName: string } | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelProcessing, setCancelProcessing] = useState(false);

  // FETCH APPOINTMENTS
  const fetchAppointments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      // Using doctor endpoint because it returns all appointments for staff/admin
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

  // UPDATE STATUS
  const updateStatus = async (id: number, newStatus: "confirmed" | "completed") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? { ...appt, status: newStatus } : appt))
      );
    } catch (err: any) {
      console.error("Action failed:", err);
      toast.error(err?.response?.data?.detail || "Action failed");
    }
  };

  // CANCEL MODAL
  const openCancelModal = (id: number, patientName: string) => {
    setCancelData({ id, patientName });
    setCancellationReason("");
  };

  const confirmCancellation = async () => {
    if (!cancelData) return;
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    try {
      setCancelProcessing(true);
      await api.put(`/appointments/${cancelData.id}/status`, {
        status: "cancelled",
        reason: cancellationReason,
      });
      toast.success("Appointment cancelled");
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === cancelData.id ? { ...appt, status: "cancelled" } : appt))
      );
      setCancelData(null);
    } catch (err: any) {
      console.error("Cancel failed:", err);
      toast.error(err?.response?.data?.detail || "Failed to cancel");
    } finally {
      setCancelProcessing(false);
    }
  };

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
      displayString: `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
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
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Modals */}
        <RescheduleModal
          isOpen={!!rescheduleData}
          onClose={() => setRescheduleData(null)}
          appointmentId={rescheduleData?.id || 0}
          currentDate={rescheduleData?.date || ""}
          onSuccess={() => {
            fetchAppointments();
            setRescheduleData(null);
          }}
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
                  placeholder="e.g. System requirement, policy failure..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="p-4 flex gap-3 pt-0">
                <button onClick={() => setCancelData(null)} disabled={cancelProcessing} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all">
                  Go Back
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={cancelProcessing || !cancellationReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelProcessing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Appointments</h2>
            <p className="text-slate-500 mt-1 font-medium">Administrator oversight of all bookings</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm w-48"
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
                    ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200"
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
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-1">No appointments found</h3>
            <p className="text-slate-500">There are no {filter !== "all" ? filter : ""} appointments to display</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/40 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-wider text-left">
                    <th className="py-5 px-8">Patient</th>
                    <th className="py-5 px-6">Doctor</th>
                    <th className="py-5 px-6">Schedule</th>
                    <th className="py-5 px-6">Status</th>
                    <th className="py-5 px-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {filteredAppointments.map((appt) => {
                    const { date, time, displayString, isPast } = formatDateTime(appt.appointment_date);
                    const statusStyle = getStatusStyles(appt.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <tr key={appt.id} className="group hover:bg-slate-50/80 transition-colors">
                        {/* Patient */}
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100/50 flex items-center justify-center text-blue-600 font-bold shadow-sm overflow-hidden">
                              {appt.patient_avatar ? (
                                <img src={appt.patient_avatar} alt={appt.patient_name} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                              <p className="text-xs font-semibold text-blue-600">ID: 2026-{appt.patient_id}</p>
                            </div>
                          </div>
                        </td>
                        {/* Doctor */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold border border-emerald-100">
                               Dr
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-700">{appt.doctor_name}</p>
                             </div>
                          </div>
                        </td>
                        {/* Schedule */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isPast ? "text-slate-400" : "text-slate-800"}`}>{date}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{time}</span>
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border w-fit ${statusStyle.badge}`}>
                              <StatusIcon className="w-4 h-4" />
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
                        {/* Actions */}
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                            {/* PENDING */}
                            {appt.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(appt.id, "confirmed")} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 shadow-sm transition-all" title="Confirm">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 shadow-sm transition-all" title="Reschedule">
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 shadow-sm transition-all" title="Cancel">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {/* CONFIRMED */}
                            {appt.status === "confirmed" && (
                              <>
                                <button onClick={() => updateStatus(appt.id, "completed")} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
                                  Complete
                                </button>
                                <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors" title="Reschedule">
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors" title="Cancel">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {/* COMPLETED / CANCELLED */}
                            {(appt.status === "completed" || appt.status === "cancelled") && (
                              <span className="text-xs font-bold text-slate-400 italic">
                                {appt.status === "completed" ? "Successfully Completed" : "Cancelled"}
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
                const { date, time, displayString } = formatDateTime(appt.appointment_date);
                const statusStyle = getStatusStyles(appt.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <div key={appt.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-blue-600 border border-blue-100">
                          {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full rounded-2xl object-cover" /> : <User className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                          <p className="text-xs text-slate-500 font-medium">Dr. {appt.doctor_name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${statusStyle.badge}`}>
                        <StatusIcon className="w-3 h-3" /> {statusStyle.label}
                      </span>
                    </div>
                    <div className="space-y-2 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Date:</span>
                        <span className="font-bold text-slate-900">{date}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Time:</span>
                        <span className="font-bold text-slate-900">{time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {appt.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(appt.id, "confirmed")} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20">Confirm</button>
                          <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-3 bg-white border border-slate-200 text-amber-600 rounded-xl hover:bg-slate-50"><RefreshCw className="w-5 h-5" /></button>
                          <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-3 bg-white border border-slate-200 text-rose-600 rounded-xl hover:bg-slate-50"><XCircle className="w-5 h-5" /></button>
                        </>
                      )}
                      {appt.status === "confirmed" && (
                        <>
                          <button onClick={() => updateStatus(appt.id, "completed")} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20">Complete</button>
                          <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">Cancel</button>
                        </>
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

export default AdminAppointments;
