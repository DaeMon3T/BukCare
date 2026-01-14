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
  Trash2, 
  RefreshCw, 
  UserPlus,
  Check,
  AlertTriangle
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import RescheduleModal from "@/components/RescheduleModal";
import FollowUpModal from "@/components/FollowUpModal";

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

const DoctorAppointments = () => {
  const { lastMessage } = useWebSocket();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Modal States
  const [rescheduleData, setRescheduleData] = useState<{id: number, date: string} | null>(null);
  const [followUpData, setFollowUpData] = useState<{patientId: number, name: string} | null>(null);

  // CANCEL MODAL STATE (New!)
  const [cancelData, setCancelData] = useState<{id: number, patientName: string} | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelProcessing, setCancelProcessing] = useState(false);

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

    if (lastMessage.type === "NEW_APPOINTMENT") {
      fetchAppointments(true); 
    }

    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status, new_date } = lastMessage;

      if (appointment_id && status) {
        setAppointments((prev) => 
          prev.map((appt) => 
            appt.id === appointment_id 
              ? { ...appt, status: status }
              : appt
          )
        );
      }
      
      if (new_date) {
         fetchAppointments(true);
      }
    }

    if (lastMessage.type === "APPOINTMENT_DELETED") {
      if (lastMessage.appointment_id) {
          setAppointments((prev) => 
            prev.filter((appt) => appt.id !== lastMessage.appointment_id)
          );
      }
    }
  }, [lastMessage, fetchAppointments])

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 3. UPDATE STATUS (General)
  const updateStatus = async (id: number, newStatus: "confirmed" | "completed") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      
      const statusMessages = {
        confirmed: "Appointment confirmed",
        completed: "Appointment marked completed"
      };
      
      toast.success(statusMessages[newStatus]);

      setAppointments((prev) => 
        prev.map((appt) => 
          appt.id === id ? { ...appt, status: newStatus } : appt
        )
      );
    } catch (err: any) {
      console.error("Action failed:", err);
      toast.error(err?.response?.data?.detail || "Action failed");
    }
  };

  // 4. HANDLE CANCELLATION (With Modal)
  const openCancelModal = (id: number, patientName: string) => {
      setCancelData({ id, patientName });
      setCancellationReason(""); // Reset input
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
              reason: cancellationReason 
          });

          toast.success("Appointment cancelled");

          // Update UI
          setAppointments((prev) => 
            prev.map((appt) => 
              appt.id === cancelData.id ? { ...appt, status: "cancelled" } : appt
            )
          );
          
          // Close Modal
          setCancelData(null);
      } catch (err: any) {
          console.error("Cancel failed:", err);
          toast.error(err?.response?.data?.detail || "Failed to cancel");
      } finally {
          setCancelProcessing(false);
      }
  };

  // 5. DELETE
  const deleteAppointment = async (id: number) => {
    try {
      await api.delete(`/appointments/${id}/permanent`);
      toast.success("Appointment permanently deleted");
      setDeleteConfirm(null);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err?.response?.data?.detail || "Failed to delete appointment");
    }
  };

  const filteredAppointments = appointments
    .filter((appt) => {
      if (filter === "all") return true;
      return appt.status === filter;
    })
    .sort((a, b) => {
      return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
    });

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      displayString: `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      isPast: date < new Date()
    };
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, label: "Pending" };
      case "confirmed":
        return { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Confirmed" };
      case "completed":
        return { badge: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle, label: "Completed" };
      case "cancelled":
        return { badge: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" };
      default:
        return { badge: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: status };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto py-10">
        
        {/* === MODALS === */}
        
        {/* 1. Reschedule Modal */}
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

        {/* 2. Follow Up Modal */}
        <FollowUpModal
            isOpen={!!followUpData}
            onClose={() => setFollowUpData(null)}
            patientId={followUpData?.patientId || 0}
            patientName={followUpData?.name || ""}
            onSuccess={() => {
                fetchAppointments(); 
                setFollowUpData(null);
            }}
        />

        {/* 3. NEW CANCEL MODAL (Replaces window.prompt) */}
        {cancelData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                    <div className="bg-rose-50 p-6 flex flex-col items-center text-center border-b border-rose-100">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Decline Appointment</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            You are about to cancel the appointment with <span className="font-bold text-slate-700">{cancelData.patientName}</span>.
                        </p>
                    </div>
                    
                    <div className="p-4 space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">Reason for Cancellation</label>
                        <textarea 
                            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none resize-none"
                            rows={3}
                            placeholder="e.g. Unforeseen emergency, Out of office..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="p-4 flex gap-3 bg-white pt-0">
                        <button
                            onClick={() => setCancelData(null)}
                            disabled={cancelProcessing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={confirmCancellation}
                            disabled={cancelProcessing || !cancellationReason.trim()}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelProcessing ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : "Confirm Cancel"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Appointments</h2>
            <p className="text-slate-500 mt-1">View and manage your schedule</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 mb-6 scrollbar-hide">
          {["all", "pending", "confirmed", "cancelled"].map((f) => {
            const count = f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length;
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 border ${
                    isActive 
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200" 
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
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider text-left">
                    <th className="py-4 px-6">Patient</th>
                    <th className="py-4 px-6">Schedule</th>
                    <th className="py-4 px-6">Reason</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const { date, time, displayString, isPast } = formatDateTime(appt.appointment_date);
                    const statusStyle = getStatusStyles(appt.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <tr key={appt.id} className="group hover:bg-slate-50/50 transition-colors">
                        {/* 1. Patient */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                                {appt.patient_avatar ? (
                                    <img src={appt.patient_avatar} alt={appt.patient_name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                              <p className="text-xs text-slate-500">ID: #{appt.patient_id}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Schedule */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isPast ? 'text-slate-400' : 'text-slate-800'}`}>{date}</span>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-xs font-medium text-slate-500">{time}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Reason */}
                        <td className="py-5 px-6 max-w-[250px]">
                          <p className="text-sm text-slate-600 truncate">{appt.reason || <span className="italic text-slate-400">No reason provided</span>}</p>
                          {appt.notes && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 mt-1 inline-block">Note: {appt.notes}</span>}
                        </td>

                        {/* 4. Status */}
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusStyle.badge}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            
                            {/* PENDING: Confirm / Reschedule / Cancel */}
                            {appt.status === "pending" && (
                              <>
                                <button onClick={() => updateStatus(appt.id, "confirmed")} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Confirm">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Reschedule">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Decline">
                                    <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* CONFIRMED: Complete / Reschedule / Cancel */}
                            {appt.status === "confirmed" && (
                              <>
                                <button onClick={() => updateStatus(appt.id, "completed")} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors">
                                    Complete
                                </button>
                                <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors" title="Reschedule">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 transition-colors" title="Cancel">
                                    <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* COMPLETED/CANCELLED: Delete / Follow-Up */}
                            {(appt.status === "completed" || appt.status === "cancelled") && (
                              <>
                                {appt.status === "completed" && (
                                    <button onClick={() => setFollowUpData({ patientId: appt.patient_id, name: appt.patient_name })} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Follow Up">
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {deleteConfirm === appt.id ? (
                                  <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100">
                                    <button onClick={() => deleteAppointment(appt.id)} className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Yes</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="text-[10px] font-bold bg-white text-slate-600 px-2 py-1 rounded hover:bg-slate-50 border border-slate-200">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setDeleteConfirm(appt.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete Record">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
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
                  <div key={appt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            {appt.patient_avatar ? <img src={appt.patient_avatar} className="w-full h-full rounded-full object-cover"/> : <User className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                            <p className="text-xs text-slate-500">ID: #{appt.patient_id}</p>
                          </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${statusStyle.badge}`}>
                        <StatusIcon className="w-3 h-3" /> {statusStyle.label}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
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

                    <div className="flex gap-2 flex-wrap">
                      {/* PENDING MOBILE */}
                      {appt.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(appt.id, "confirmed")} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm">Confirm</button>
                          <button onClick={() => setRescheduleData({ id: appt.id, date: displayString })} className="p-2.5 bg-amber-100 text-amber-700 rounded-lg"><RefreshCw className="w-5 h-5"/></button>
                          <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-2.5 bg-red-100 text-red-700 rounded-lg"><XCircle className="w-5 h-5"/></button>
                        </>
                      )}
                      
                      {/* CONFIRMED MOBILE */}
                      {appt.status === "confirmed" && (
                        <>
                          <button onClick={() => updateStatus(appt.id, "completed")} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">Complete</button>
                          <button onClick={() => openCancelModal(appt.id, appt.patient_name)} className="p-2.5 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">Cancel</button>
                        </>
                      )}

                      {/* DELETE MOBILE */}
                      {(appt.status === "completed" || appt.status === "cancelled") && (
                          deleteConfirm === appt.id ? (
                            <div className="flex gap-2 w-full">
                                <button onClick={() => deleteAppointment(appt.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">Yes, Delete</button>
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(appt.id)} className="w-full py-2.5 border border-slate-200 text-slate-500 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete Record
                            </button>
                          )
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

export default DoctorAppointments;