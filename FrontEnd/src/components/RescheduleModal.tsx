import React, { useState } from "react";
import { X, Calendar, Clock, FileText, AlertCircle } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  currentDate: string; // Just for display context
  onSuccess: () => void;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  appointmentId, 
  currentDate, 
  onSuccess 
}) => {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDate || !newTime) {
      toast.error("Please select both a new date and time");
      return;
    }

    setLoading(true);

    try {
      // Matches your Backend Schema: new_date, new_time, reason
      await api.put(`/appointments/${appointmentId}/reschedule`, {
        new_date: newDate,
        new_time: newTime,
        reason: reason
      });

      toast.success("Appointment rescheduled successfully!");
      onSuccess(); // Refresh the parent list
      onClose();   // Close modal
      
      // Reset form
      setNewDate("");
      setNewTime("");
      setReason("");

    } catch (err: any) {
      console.error("Reschedule failed:", err);
      // Backend conflict error usually comes in err.response.data.detail
      toast.error(err?.response?.data?.detail || "Failed to reschedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Reschedule Appointment</h3>
            <p className="text-xs text-slate-500 mt-0.5">Currently: <span className="font-medium text-slate-700">{currentDate}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Date Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500"/> New Date
            </label>
            <input 
                type="date" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Disable past dates
            />
          </div>

          {/* Time Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500"/> New Time
            </label>
            <input 
                type="time" 
                required
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700 font-medium"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500"/> Reason for Change
            </label>
            <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm resize-none h-24"
                placeholder="e.g. I have a conflict with another surgery..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Info Alert */}
          <div className="flex gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-xs">
             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
             <p>The patient will be notified immediately about this schedule change.</p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button 
                type="button" 
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;