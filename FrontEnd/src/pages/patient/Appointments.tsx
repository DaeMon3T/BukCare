import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Star,
  MessageSquarePlus
} from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import ReviewModal from "@/components/ReviewModal"; // 👈 IMPORT THE MODAL

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name?: string;
  appointment_date: string;
  reason: string | null;
  status: string; // "pending" | "confirmed" | "completed" | "cancelled"
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Optional: Add this later to your backend to disable the button if already reviewed
  has_reviewed?: boolean; 
  doctor_avatar?: string;
  doctor_specialization?: string;
}

const PatientAppointments = () => {
  const { lastMessage } = useWebSocket();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // REVIEW MODAL STATE
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedApptForReview, setSelectedApptForReview] = useState<Appointment | null>(null);

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

  // 2. REAL-TIME LISTENER
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "APPOINTMENT_UPDATE") {
      const { appointment_id, status } = lastMessage;
      
      if (appointment_id && status) {
          setAppointments((prev) => 
            prev.map((appt) => 
              appt.id === appointment_id 
                ? { ...appt, status: status } 
                : appt
            )
          );
          toast.success(`Appointment marked as ${status}`);
      }
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

  // 3. HANDLERS
  const handleOpenReview = (appt: Appointment) => {
    setSelectedApptForReview(appt);
    setIsReviewOpen(true);
  };

  const handleReviewSuccess = () => {
    // Optional: Mark locally as reviewed if you add that field later
    // setAppointments(prev => prev.map(a => a.id === selectedApptForReview?.id ? {...a, has_reviewed: true} : a));
  };

  // 4. SORTING & FILTERING
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
        
        {/* REVIEW MODAL COMPONENT */}
        {selectedApptForReview && (
            <ReviewModal 
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                doctorId={selectedApptForReview.doctor_id}
                appointmentId={selectedApptForReview.id}
                onSuccess={handleReviewSuccess}
            />
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
                <p className="text-slate-500 mt-1">Track your health journey and upcoming visits.</p>
            </div>
        </div>

        {/* Filters */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => {
                const count = f === "all" ? appointments.length : appointments.filter(a => a.status === f).length;
                const isActive = filter === f;
                return (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                            isActive 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20" : "bg-slate-100"}`}>
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
                        <Search className="w-10 h-10 text-slate-300" />
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
                    <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                        <table className="min-w-full">
                            {/* HEADER */}
                            <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                                <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Doctor
                                </th>
                                <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Schedule
                                </th>
                                <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Status
                                </th>
                                <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Details
                                </th>
                                <th className="py-5 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                                Actions
                                </th>
                            </tr>
                            </thead>

                            {/* BODY */}
                            <tbody className="divide-y divide-slate-100">
                            {filteredAppointments.map((appt) => {
                                const { date, time, isPast } = formatDateTime(appt.appointment_date);
                                const statusMeta = getStatusStyles(appt.status);
                                const StatusIcon = statusMeta.icon;

                                return (
                                <tr 
                                    key={appt.id} 
                                    className="group hover:bg-slate-50/80 transition-colors duration-200"
                                >
                                    {/* 1. Doctor Column */}
                                    <td className="py-5 px-6">
                                      <div className="flex items-center gap-4">
                                        <div className="relative">
                                          {/* CONDITIONAL RENDERING: Real Avatar vs Default Icon */}
                                          {appt.doctor_avatar ? (
                                            <img 
                                              src={appt.doctor_avatar} 
                                              alt="Dr."
                                              className="w-12 h-12 rounded-2xl object-cover border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform duration-300"
                                              onError={(e) => {
                                                // Fallback if image fails to load
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                              }}
                                            />
                                          ) : null}
                                          
                                          {/* Fallback Icon (Hidden if image loads successfully) */}
                                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-105 transition-transform duration-300 ${appt.doctor_avatar ? 'hidden' : ''}`}>
                                            <User className="w-5 h-5" />
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <p className="text-sm font-bold text-slate-900 leading-tight">
                                            Dr. {appt.doctor_name || `#${appt.doctor_id}`}
                                          </p>
                                          <p className="text-xs font-medium text-slate-400 mt-1">
                                            {appt.doctor_specialization || "General Practice"}
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    {/* 2. Schedule Column */}
                                    <td className="py-5 px-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-bold ${isPast ? "text-slate-500" : "text-slate-700 group-hover:text-blue-600 transition-colors"}`}>
                                            {date}
                                        </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {time}
                                        </span>
                                        </div>
                                    </div>
                                    </td>

                                    {/* 3. Status Column */}
                                    <td className="py-5 px-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${statusMeta.style}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                    </span>
                                    </td>

                                    {/* 4. Details Column */}
                                    <td className="py-5 px-6">
                                    <div className="max-w-[200px]">
                                        <p className="text-sm text-slate-600 truncate font-medium">
                                        {appt.reason || <span className="text-slate-400 italic font-normal">No reason provided</span>}
                                        </p>
                                        {appt.notes && (
                                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                                            <span className="font-bold">Note:</span> {appt.notes}
                                        </div>
                                        )}
                                    </div>
                                    </td>

                                    {/* 5. Actions Column */}
                                    <td className="py-5 px-6 text-right">
                                    {appt.status === "completed" && (
                                        <button
                                        onClick={() => handleOpenReview(appt)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-600 text-xs font-bold border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group-hover:shadow-md active:scale-95"
                                        >
                                        <Star className="w-4 h-4 fill-indigo-100 text-indigo-500" /> 
                                        Rate Doctor
                                        </button>
                                    )}
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
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.style} transition-colors duration-300`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-3">
                                        <span className="font-semibold text-slate-900 block mb-1 text-xs uppercase tracking-wide">Reason</span>
                                        {appt.reason || "No reason provided"}
                                    </div>

                                    {/* MOBILE ACTION BUTTON */}
                                    {appt.status === "completed" && (
                                        <button
                                            onClick={() => handleOpenReview(appt)}
                                            className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <MessageSquarePlus className="w-4 h-4" /> Rate & Review Doctor
                                        </button>
                                    )}
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

// Skeleton Component
const AppointmentsSkeleton = () => (
    <div className="animate-pulse">
        <div className="hidden md:flex border-b border-slate-100 bg-slate-50/50 px-6 py-4 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-4 bg-slate-200 rounded w-24"></div>)}
        </div>
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