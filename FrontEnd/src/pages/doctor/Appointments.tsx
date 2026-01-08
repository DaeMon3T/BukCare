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

  // 2. WEBSOCKET LISTENER
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "NEW_APPOINTMENT") {
      fetchAppointments(true); 
    }

    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      setAppointments((prev) => 
        prev.map((appt) => 
          appt.id === lastMessage.appointment_id 
            ? { ...appt, status: lastMessage.status } 
            : appt
        )
      );
    }

    if (lastMessage.type === "APPOINTMENT_DELETED") {
      setAppointments((prev) => 
        prev.filter((appt) => appt.id !== lastMessage.appointment_id)
      );
    }
  }, [lastMessage, fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 3. UPDATE STATUS (Updated to include "cancelled")
  const updateStatus = async (id: number, newStatus: "confirmed" | "completed" | "cancelled") => {
    try {
      await api.put(`/appointments/${id}/status`, { status: newStatus });
      
      const statusMessages = {
        confirmed: "Appointment confirmed",
        completed: "Appointment marked completed",
        cancelled: "Appointment cancelled"
      };
      
      toast.success(statusMessages[newStatus]);

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

  // 4. DELETE
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
      // Turn strings into Dates and subtract to sort
      // (b - a) means Descending Order (Latest First)
      return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
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
            <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <table className="min-w-full">
                {/* HEADER */}
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
                    const { date, time } = formatDateTime(appt.appointment_date);
                    const statusStyle = getStatusStyles(appt.status);

                    return (
                      <tr 
                        key={appt.id} 
                        className="group hover:bg-slate-50/80 transition-colors duration-200"
                      >
                        {/* 1. Patient Column */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                <User className="w-5 h-5" />
                              </div>
                              {/* Online Indicator (Optional decoration) */}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white"></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                {appt.patient_name}
                              </p>
                              <p className="text-xs font-medium text-slate-400 mt-1">
                                ID: <span className="font-mono text-slate-500">#{appt.patient_id}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Date & Time Column */}
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                {date}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-300" />
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {time}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Reason Column */}
                        <td className="py-5 px-6">
                          <div className="max-w-[220px]">
                            <p className={`text-sm leading-relaxed ${appt.reason ? "text-slate-600" : "text-slate-400 italic"}`}>
                              {appt.reason || "No reason provided"}
                            </p>
                            {appt.notes && (
                              <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                                <span className="font-bold">Note:</span> {appt.notes}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 4. Status Column */}
                        <td className="py-5 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${statusStyle.badge}`}>
                            {statusStyle.icon}
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                          </span>
                        </td>

                        {/* 5. Actions Column */}
                        <td className="py-5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                            {appt.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateStatus(appt.id, "confirmed")}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-200 hover:shadow-lg hover:translate-y-[-1px] transition-all"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updateStatus(appt.id, "cancelled")}
                                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-100 transition-all"
                                  title="Decline Appointment"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {appt.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() => updateStatus(appt.id, "completed")}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-200 hover:shadow-lg hover:translate-y-[-1px] transition-all"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => updateStatus(appt.id, "cancelled")}
                                  className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200 transition-all"
                                  title="Cancel Appointment"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {(appt.status === "completed" || appt.status === "cancelled") && (
                              <>
                                {deleteConfirm === appt.id ? (
                                  <div className="flex items-center gap-2 bg-red-50 p-1 rounded-xl border border-red-100 animate-fade-in">
                                    <span className="text-[10px] font-bold text-red-600 px-2">Sure?</span>
                                    <button
                                      onClick={() => deleteAppointment(appt.id)}
                                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-3 py-1.5 rounded-lg bg-white text-slate-600 text-xs font-bold border border-slate-200 hover:bg-slate-50"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(appt.id)}
                                    className="p-2 rounded-xl bg-white text-slate-400 border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all"
                                    title="Delete from history"
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
                    className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{appt.patient_name}</p>
                          <p className="text-xs text-slate-500">ID: #{appt.patient_id}</p>
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
                    </div>

                    <div className="flex gap-2">
                    {appt.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(appt.id, "confirmed")}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(appt.id, "cancelled")}
                          className="flex-1 px-4 py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-semibold hover:bg-red-100 transition-all"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {appt.status === "confirmed" && (
                      <>
                        <button
                          onClick={() => updateStatus(appt.id, "completed")}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(appt.id, "cancelled")}
                          className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {(appt.status === "completed" || appt.status === "cancelled") && (
                      <>
                        {deleteConfirm === appt.id ? (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => deleteAppointment(appt.id)}
                              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
                            >
                              Back
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(appt.id)}
                            className="w-full px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-semibold hover:bg-red-100 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Appointment
                          </button>
                        )}
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

export default DoctorAppointments;