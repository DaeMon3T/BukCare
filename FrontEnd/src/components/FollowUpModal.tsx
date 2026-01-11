import React, { useState } from "react";
import { X, Calendar, Clock, FileText, UserPlus, AlertCircle } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  onSuccess: () => void;
}

const FollowUpModal: React.FC<FollowUpModalProps> = ({ 
  isOpen, 
  onClose, 
  patientId, 
  patientName, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time) {
      toast.error("Please select a date and time");
      return;
    }

    setLoading(true);

    try {
      // Combined ISO datetime for the backend
      const appointmentDate = new Date(`${date}T${time}`);

      // Matches your Updated AppointmentCreate Schema
      const payload = {
        doctor_id: Number(user?.id), // Required by schema, but backend uses current_user to be safe
        patient_id: patientId, // Tells backend who this is for
        appointment_date: appointmentDate.toISOString(),
        reason: reason || "Follow-up checkup",
        notes: "Booked via Doctor Follow-up"
      };

      await api.post("/appointments/", payload);

      toast.success("Follow-up appointment booked!");
      onSuccess();
      onClose();
      
      // Reset
      setDate("");
      setTime("");
      setReason("");

    } catch (err: any) {
      console.error("Booking failed:", err);
      toast.error(err?.response?.data?.detail || "Failed to book follow-up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600"/> Book Follow-Up
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Patient: <span className="font-medium text-slate-700">{patientName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500"/> Date
            </label>
            <input 
                type="date" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500"/> Time
            </label>
            <input 
                type="time" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
                value={time}
                onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500"/> Purpose
            </label>
            <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none h-20"
                placeholder="e.g. Regular follow-up for blood pressure..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-xs">
             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
             <p>This appointment will be automatically <strong>Confirmed</strong>.</p>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpModal;