import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Trash2, History } from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";

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
}

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { lastMessage } = useWebSocket();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // 1. FETCH APPOINTMENTS
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

  // 2. WEBSOCKET LISTENER (Updates from Patients/Other Devices)
  useEffect(() => {
    if (!lastMessage) return;

    // SCENARIO A: A Patient booked a NEW appointment
    if (lastMessage.type === "NEW_APPOINTMENT") {
      // We just want to refresh the data silently. The Navbar handles the notification.
      console.log("Silent refresh triggered by socket");
      fetchAppointments(true); 
    }

    // SCENARIO B: Status was updated
    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      setAppointments((prev) => 
        prev.map((appt) => 
          appt.id === lastMessage.appointment_id 
            ? { ...appt, status: lastMessage.status } 
            : appt
        )
      );
    }

    // SCENARIO C: Appointment was deleted (System Signal)
    if (lastMessage.type === "APPOINTMENT_DELETED") {
      setAppointments((prev) => 
        prev.filter((appt) => appt.id !== lastMessage.appointment_id)
      );
    }
  }, [lastMessage, fetchAppointments]);

  // Initial Load
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 3. ⚡ UPDATE STATUS (Local Update + API)
  const updateStatus = async (id: number, newStatus: "confirmed" | "completed") => {
    try {
      // 1. Call API
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);

      // 2. ✅ MANUAL UPDATE: Update local state instantly (Don't wait for socket)
      setAppointments((prev) => 
        prev.map((appt) => 
          appt.id === id 
            ? { ...appt, status: newStatus } 
            : appt
        )
      );
    } catch (err: any) {
      console.error("Action failed:", err);
      toast.error(err?.response?.data?.detail || "Action failed");
    }
  };

  // 4. ⚡ DELETE (Local Update + API)
  const deleteAppointment = async (id: number) => {
    try {
      await api.delete(`/appointments/${id}/permanent`);
      toast.success("Appointment permanently deleted");
      setDeleteConfirm(null);

      // ✅ MANUAL UPDATE: Remove from list instantly
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast.error(err?.response?.data?.detail || "Failed to delete appointment");
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "all") return true;
    return appt.status === filter;
  });

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return {
          badge: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200",
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
        };
      case "confirmed":
        return {
          badge: "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-200",
          icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
        };
      case "completed":
        return {
          badge: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200",
          icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
        };
      case "cancelled":
        return {
          badge: "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-200",
          icon: <XCircle className="w-4 h-4 text-red-600" />,
        };
      default:
        return {
          badge: "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-200",
          icon: <AlertCircle className="w-4 h-4 text-slate-600" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
              My Appointments
            </h2>
            <p className="text-slate-600">View and manage your appointments</p>
          </div>
          <button
            onClick={() => navigate("/doctor/appointment-history")}
            className="px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            View History
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 flex-wrap mb-6">
          {["all", "pending", "confirmed"].map((f) => {
            const count = f === "all" 
              ? appointments.length 
              : appointments.filter((a) => a.status === f).length;
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                  filter === f
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-white text-slate-700 hover:bg-slate-50 shadow-sm border border-slate-200 hover:shadow-md hover:scale-105"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === f ? "bg-white/25" : "bg-slate-100"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No appointments found</h3>
            <p className="text-slate-500">There are no {filter !== "all" ? filter : ""} appointments to display</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden bg-white rounded-2xl shadow-lg border border-slate-200">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Patient ID</th>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Patient Name</th>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Date & Time</th>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Reason</th>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Status</th>
                    <th className="p-4 text-left text-sm font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const { date, time } = formatDateTime(appt.appointment_date);
                    const statusStyle = getStatusStyles(appt.status);
                    
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">Patient #{appt.patient_id}</p>
                              <p className="text-xs text-slate-500">ID: {appt.id}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-gray-900 font-medium">
                          {appt.patient_name}
                        </td>

                        <td className="p-4">
                          <div className="flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{date}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-600">{time}</p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-slate-700 max-w-xs truncate">
                            {appt.reason || <span className="text-slate-400 italic">No reason provided</span>}
                          </p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}
                          >
                            {statusStyle.icon}
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {appt.status === "pending" && (
                              <button
                                onClick={() => updateStatus(appt.id, "confirmed")}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                              >
                                Confirm
                              </button>
                            )}
                            {appt.status === "confirmed" && (
                              <button
                                onClick={() => updateStatus(appt.id, "completed")}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                              >
                                Complete
                              </button>
                            )}
                            {(appt.status === "completed" || appt.status === "cancelled") && (
                              <>
                                {deleteConfirm === appt.id ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => deleteAppointment(appt.id)}
                                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-all"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-all"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(appt.id)}
                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                                    title="Delete appointment"
                                  >
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
                const { date, time } = formatDateTime(appt.appointment_date);
                const statusStyle = getStatusStyles(appt.status);
                
                return (
                  <div
                    key={appt.id}
                    className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Patient #{appt.patient_id}</p>
                          <p className="text-xs text-slate-500">ID: {appt.id}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${statusStyle.badge}`}
                      >
                        {statusStyle.icon}
                        {appt.status}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700">Date:</span>
                        <span className="text-slate-900">{date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-700">Time:</span>
                        <span className="text-slate-900">{time}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-600 mb-1">Reason:</p>
                        <p className="text-sm text-slate-700">
                          {appt.reason || <span className="text-slate-400 italic">No reason provided</span>}
                        </p>
                      </div>
                      {appt.notes && (
                        <div className="pt-3 border-t border-slate-100">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Notes:</p>
                          <p className="text-sm text-slate-700">{appt.notes}</p>
                        </div>
                      )}
                    </div>

                    {appt.status === "pending" && (
                      <button
                        onClick={() => updateStatus(appt.id, "confirmed")}
                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Confirm Appointment
                      </button>
                    )}
                    {appt.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(appt.id, "completed")}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {(appt.status === "completed" || appt.status === "cancelled") && (
                      <>
                        {deleteConfirm === appt.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteAppointment(appt.id)}
                              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(appt.id)}
                            className="w-full px-4 py-3 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Appointment
                          </button>
                        )}
                      </>
                    )}
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