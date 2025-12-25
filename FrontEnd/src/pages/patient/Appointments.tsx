import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Trash2, Filter } from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  appointment_date: string;
  reason: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const PatientAppointments = () => {
  const { lastMessage } = useWebSocket();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  // 1. FETCH APPOINTMENTS
  const fetchAppointments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await api.get("/appointments/");
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

    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      setAppointments((prev) => 
        prev.map((appt) => 
          appt.id === lastMessage.appointment_id 
            ? { ...appt, status: lastMessage.status } 
            : appt
        )
      );
      toast.success(`Appointment status updated to ${lastMessage.status}`);
    }

    if (lastMessage.type === "NEW_APPOINTMENT") {
      fetchAppointments(true);
      toast.success("New appointment received!");
    }
  }, [lastMessage, fetchAppointments]);

  // Initial Load
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 4. SORTING & FILTERING
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    if (filter !== "all") {
        filtered = appointments.filter((appt) => appt.status === filter);
    }

    // Sort: Upcoming (Pending/Confirmed) first, then by Date descending
    return filtered.sort((a, b) => {
        const dateA = new Date(a.appointment_date).getTime();
        const dateB = new Date(b.appointment_date).getTime();
        return dateB - dateA; // Newest first
    });
  }, [appointments, filter]);

  const formatDateTime = (dateTimeString: string) => {
    const dateObj = new Date(dateTimeString);
    return {
      date: dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
      isPast: dateObj < new Date()
    };
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "pending":
        return { style: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle };
      case "confirmed":
        return { style: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle };
      case "completed":
        return { style: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle };
      case "cancelled":
        return { style: "bg-red-50 text-red-700 border-red-200", icon: XCircle };
      default:
        return { style: "bg-slate-50 text-slate-700 border-slate-200", icon: AlertCircle };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
                <p className="text-slate-500 mt-1">Track your health journey and upcoming visits.</p>
            </div>
            
            {/* Quick Stats or Action could go here */}
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-4 no-scrollbar">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => {
                const count = f === "all" ? appointments.length : appointments.filter(a => a.status === f).length;
                const isActive = filter === f;
                return (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                            isActive 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20" : "bg-slate-100"}`}>
                            {count}
                        </span>
                    </button>
                )
            })}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            {loading ? (
                <AppointmentsSkeleton />
            ) : filteredAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No appointments found</h3>
                    <p className="text-slate-500 max-w-sm text-center mt-1">
                        {filter === "all" 
                            ? "You haven't booked any appointments yet." 
                            : `You don't have any ${filter} appointments.`}
                    </p>
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Doctor</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAppointments.map((appt) => {
                                    const { date, time, isPast } = formatDateTime(appt.appointment_date);
                                    const statusMeta = getStatusStyles(appt.status);
                                    const StatusIcon = statusMeta.icon;

                                    return (
                                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">Dr. {appt.doctor_name || `#${appt.doctor_id}`}</p>
                                                        <p className="text-xs text-slate-500">General Practice</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${isPast ? "text-slate-500" : "text-slate-900"}`}>{date}</span>
                                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {time}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.style}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px]">
                                                    <p className="text-sm text-slate-700 truncate" title={appt.reason || ""}>
                                                        {appt.reason || "No reason provided"}
                                                    </p>
                                                    {appt.notes && (
                                                        <p className="text-xs text-slate-400 truncate mt-0.5">Note: {appt.notes}</p>
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
                    <div className="md:hidden divide-y divide-slate-100">
                        {filteredAppointments.map((appt) => {
                            const { date, time } = formatDateTime(appt.appointment_date);
                            const statusMeta = getStatusStyles(appt.status);
                            
                            return (
                                <div key={appt.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">Dr. {appt.doctor_name || `#${appt.doctor_id}`}</h4>
                                                <p className="text-xs text-slate-500">{date} at {time}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.style}`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-3">
                                        <span className="font-semibold text-slate-900 block mb-1 text-xs uppercase tracking-wide">Reason</span>
                                        {appt.reason || "No reason provided"}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
      </main>
    </div>
  );
};

// 5. SKELETON COMPONENT
const AppointmentsSkeleton = () => (
    <div className="animate-pulse">
        {/* Header Skeleton */}
        <div className="hidden md:flex border-b border-slate-100 bg-slate-50/50 px-6 py-4 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-slate-200 rounded w-24"></div>)}
        </div>
        {/* Rows Skeleton */}
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 flex items-center gap-6 border-b border-slate-50">
                <div className="flex items-center gap-3 w-1/4">
                    <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-1/5"></div>
                <div className="h-6 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded flex-1"></div>
            </div>
        ))}
    </div>
);

export default PatientAppointments;