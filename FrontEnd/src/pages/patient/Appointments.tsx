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
  Ban,
  AlertTriangle,
  Calendar,
  FileText,
  Check,
  ArrowUpDown
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import ReviewModal from "@/components/ReviewModal"; 

// --- TYPES ---
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
  appointment_type?: "online" | "walk_in";
}

// --- HELPER COMPONENT: AVATAR ---
const DoctorAvatar = ({ 
    src, 
    name, 
    size = "w-12 h-12", 
    fontSize = "text-lg" 
}: { 
    src?: string | null | undefined; 
    name?: string | null | undefined; 
    size?: string; 
    fontSize?: string 
}) => {
    const [imgError, setImgError] = useState(false);

    if (src && !imgError) {
        return (
            <img 
                src={src} 
                alt={name || "Doctor"} 
                className={`${size} rounded-full object-cover border border-slate-200 shadow-sm`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`${size} rounded-full bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold shadow-sm ${fontSize}`}>
            {name?.charAt(0).toUpperCase() || "D"}
        </div>
    );
};

const PatientAppointments = () => {
  const { lastMessage } = useWebSocket();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "status">("date_desc");

  // REVIEW MODAL STATE
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApptForReview, setSelectedApptForReview] = useState<Appointment | null>(null);

  // CANCEL MODAL STATE
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelProcessing, setCancelProcessing] = useState(false);
  const [cancellationReason, setCancellationReason] = useState(""); 

  // 1. FETCH APPOINTMENTS
  const fetchAppointments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const response = await api.get("/appointments/"); // Patient endpoint
      setAppointments(response.data);
    } catch (err: any) {
      console.error("Failed to load appointments:", err);
      if (!isBackground) toast.error("Failed to load appointments");
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // 2. REAL-TIME LISTENER
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status } = lastMessage;
      
      if (appointment_id && status) {
          // Optimistic update
          setAppointments((prev) => 
            prev.map((appt) => 
              appt.id === appointment_id 
                ? { ...appt, status: status } 
                : appt
            )
          );
      }
    }

    if (lastMessage.type === "NEW_APPOINTMENT") {
      fetchAppointments(true);
    }
  }, [lastMessage, fetchAppointments]);

  // Initial Load
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // 3. HANDLERS
  const handleOpenReview = (appt: Appointment) => {
    setSelectedApptForReview(appt);
    setIsReviewOpen(true);
  };

  const handleReviewSuccess = () => {
    // Optimistically update the list so the button disables instantly
    if (selectedApptForReview) {
        setAppointments(prev => prev.map(a => 
            a.id === selectedApptForReview.id 
                ? { ...a, has_reviewed: true } 
                : a
        ));
    }
    fetchAppointments(true); // Refresh data from backend to confirm
    toast.success("Review submitted successfully!");
    setIsReviewOpen(false);
  };

  // --- CANCEL HANDLERS ---
  const initiateCancel = (appt: Appointment) => {
    setAppointmentToCancel(appt);
    setCancellationReason(""); 
    setIsCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!appointmentToCancel) return;
    if (!cancellationReason.trim()) {
        toast.error("Please provide a reason for cancellation");
        return;
    }
    
    try {
        setCancelProcessing(true);
        await api.put(`/appointments/${appointmentToCancel.id}/status`, { 
            status: "cancelled",
            reason: cancellationReason 
        });
        
        toast.success("Appointment cancelled successfully");
        
        setAppointments(prev => prev.map(a => 
            a.id === appointmentToCancel.id ? { ...a, status: "cancelled" } : a
        ));
        
        setIsCancelModalOpen(false);
        setAppointmentToCancel(null);
    } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Failed to cancel appointment");
    } finally {
        setCancelProcessing(false);
    }
  };

  // 4. SORTING & FILTERING
  const filteredAppointments = appointments
    .filter((appt) => {
      if (filter === "all") return true;
      return appt.status === filter;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

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
        return { style: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, label: "Pending" };
      case "confirmed":
        return { style: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Confirmed" };
      case "completed":
        return { style: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle, label: "Completed" };
      case "expired":
        return { style: "bg-gray-50 text-gray-400 border-gray-100 italic", icon: Clock, label: "Expired" };
      case "cancelled":
        return { style: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Cancelled" };
      default:
        return { style: "bg-slate-100 text-slate-700 border-slate-200", icon: AlertCircle, label: status };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        </div>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* REVIEW MODAL */}
        {selectedApptForReview && (
            <ReviewModal 
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                doctorId={selectedApptForReview.doctor_id}
                appointmentId={selectedApptForReview.id}
                onSuccess={handleReviewSuccess}
            />
        )}

        {/* CANCEL MODAL */}
        {isCancelModalOpen && appointmentToCancel && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                    <div className="bg-rose-50 p-6 flex flex-col items-center text-center border-b border-rose-100">
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 text-rose-600 shadow-sm">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Cancel Appointment?</h3>
                        <p className="text-sm text-slate-500 mt-2">
                            Are you sure you want to cancel your appointment with <span className="font-bold text-slate-700">Dr. {appointmentToCancel.doctor_name}</span>?
                        </p>
                    </div>
                
                    <div className="p-5 space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reason for Cancellation</label>
                        <textarea 
                            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none resize-none bg-slate-50 transition-all"
                            rows={3}
                            placeholder="e.g., Scheduling conflict, feeling better..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                        />
                    </div>

                    <div className="p-5 flex gap-3 bg-white pt-0">
                        <button
                            onClick={() => setIsCancelModalOpen(false)}
                            disabled={cancelProcessing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
                        >
                            Keep it
                        </button>
                        <button
                            onClick={confirmCancellation}
                            disabled={cancelProcessing || !cancellationReason.trim()}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelProcessing ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : "Yes, Cancel"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
                <p className="text-slate-500 mt-1 text-sm md:text-base">Track your health journey and upcoming visits.</p>
            </div>
            
            {/* SORT DROPDOWN */}
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                <ArrowUpDown className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                    <option value="status">By Status</option>
                </select>
            </div>
        </div>
        
        {/* TABS / FILTERS */}
        <div className="flex overflow-x-auto pb-2 gap-1.5 md:gap-2 mb-4 md:mb-6 scrollbar-hide">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => {
                const count = f === "all" ? appointments.length : appointments.filter(a => a.status === f).length;
                const isActive = filter === f;
                return (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                            isActive 
                                ? "bg-blue-600 text-white border-blue-600 shadow-md md:shadow-lg shadow-blue-200 scale-100 md:scale-105" 
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        {count > 0 && (
                            <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                                {count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>

        {/* APPOINTMENT LIST */}
        <div className="space-y-4">
            {loading ? (
                <AppointmentsSkeleton />
            ) : filteredAppointments.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No appointments found</h3>
                    <p className="text-slate-500 mt-1 max-w-xs">
                        {filter === "all" 
                            ? "You haven't booked any appointments yet." 
                            : `You don't have any ${filter} appointments.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
                    
                    {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-300 text-xs uppercase text-slate-700 font-bold tracking-wider">
                                    <th className="py-4 px-6">Doctor</th>
                                    <th className="py-4 px-6">Schedule</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6">Details</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300">
                                {filteredAppointments.map((appt) => {
                                    const { date, time, isPast } = formatDateTime(appt.appointment_date);
                                    const statusMeta = getStatusStyles(appt.status);
                                    const StatusIcon = statusMeta.icon;

                                    return (
                                        <tr key={appt.id} className="group hover:bg-blue-50 transition-colors">
                                            {/* DOCTOR INFO */}
                                            <td className="py-5 px-6 align-top">
                                                <div className="flex items-center gap-4">
                                                    <DoctorAvatar 
                                                        src={appt.doctor_avatar} 
                                                        name={appt.doctor_name} 
                                                        size="w-12 h-12"
                                                    />
                                                    <div>
                                                        <p className="font-bold text-slate-900">Dr. {appt.doctor_name}</p>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {appt.doctor_specialization 
                                                                ? appt.doctor_specialization.replace(/[\[\]"]/g, "") 
                                                                : "General Practice"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SCHEDULE */}
                                            <td className="py-5 px-6 align-top">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm ${isPast ? "text-slate-400" : "text-slate-800"}`}>
                                                        {date}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 text-xs font-medium bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                                                        <Clock className="w-3 h-3" /> {time}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* STATUS */}
                                            <td className="py-5 px-6 align-top">
                                                <div className="flex flex-col gap-2">
                                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${statusMeta.style}`}>
                                                      <StatusIcon className="w-3.5 h-3.5" />
                                                      {statusMeta.label}
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

                                            {/* DETAILS */}
                                            <td className="py-5 px-6 align-top max-w-[250px]">
                                                <p className="text-sm text-slate-600 font-medium italic truncate flex items-center gap-2">
                                                    <FileText className="w-3 h-3 text-slate-400" />
                                                    "{appt.reason || "No reason provided"}"
                                                </p>
                                                {appt.notes && (
                                                    <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md w-fit border border-amber-100 flex items-center gap-1">
                                                        <span className="font-bold">Note:</span> {appt.notes}
                                                    </p>
                                                )}
                                            </td>

                                            {/* ACTIONS */}
                                            <td className="py-5 px-6 align-top text-right">
                                                <div className="flex justify-end gap-2">
                                                    {appt.status === "completed" && (
                                                        appt.has_reviewed ? (
                                                            <div className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-xs font-bold border border-slate-100 flex items-center gap-1 cursor-default">
                                                                <Check className="w-3 h-3" /> Reviewed
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleOpenReview(appt)}
                                                                className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-bold border border-indigo-100 flex items-center gap-1"
                                                            >
                                                                <Star className="w-3 h-3" /> Rate
                                                            </button>
                                                        )
                                                    )}
                                                    {["pending", "confirmed"].includes(appt.status) && (
                                                        <button
                                                            onClick={() => initiateCancel(appt)}
                                                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all text-xs font-bold flex items-center gap-1"
                                                        >
                                                            <Ban className="w-3 h-3" /> Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* --- MOBILE CARD VIEW (Hidden on Desktop) --- */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {filteredAppointments.map((appt) => {
                            const { date, time } = formatDateTime(appt.appointment_date);
                            const statusMeta = getStatusStyles(appt.status);
                            
                            return (
                                <div key={appt.id} className="p-5 flex flex-col gap-4 bg-white hover:bg-slate-50 transition-colors">
                                    {/* Header: Dr info & Status */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-3">
                                            {/* Mobile Avatar */}
                                            <DoctorAvatar 
                                                src={appt.doctor_avatar} 
                                                name={appt.doctor_name} 
                                                size="w-12 h-12"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-900">Dr. {appt.doctor_name}</h4>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {appt.doctor_specialization ? appt.doctor_specialization.replace(/[\[\]"]/g, "") : "General Practice"}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                                                    <Calendar className="w-3 h-3" />
                                                    <span className="font-bold">{date}</span>
                                                    <span>•</span>
                                                    <span>{time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border capitalize ${statusMeta.style}`}>
                                            {appt.status}
                                        </span>
                                    </div>

                                    {/* Reason Body */}
                                    <div className="text-sm bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                                        <div className="flex gap-2 text-slate-600 italic">
                                            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                            <p>"{appt.reason || "No reason provided"}"</p>
                                        </div>
                                        {appt.notes && (
                                            <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                                                <span className="font-bold">Note:</span> {appt.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {appt.status === "completed" && (
                                            appt.has_reviewed ? (
                                                <div className="flex-1 py-2.5 rounded-xl bg-slate-50 text-slate-400 text-sm font-bold border border-slate-200 flex items-center justify-center gap-2 cursor-default">
                                                    <Check className="w-4 h-4" /> Reviewed
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleOpenReview(appt)}
                                                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                                >
                                                    <Star className="w-4 h-4" /> Rate Doctor
                                                </button>
                                            )
                                        )}
                                        {["pending", "confirmed"].includes(appt.status) && (
                                            <button 
                                                onClick={() => initiateCancel(appt)}
                                                className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-bold hover:bg-rose-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Ban className="w-4 h-4" /> Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

// Skeleton Component
const AppointmentsSkeleton = () => (
    <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-slate-100 rounded w-20"></div>
            </div>
        ))}
    </div>
);

export default PatientAppointments;