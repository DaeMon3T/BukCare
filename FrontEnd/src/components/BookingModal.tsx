import React, { useState, useEffect } from "react";
import type { Doctor } from "./DoctorCard";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/api";
import toast from "react-hot-toast";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  doctor: Doctor | null;
  onClose: () => void;
  onConfirm: (details: {
    date: string;
    time: string;
    reason: string;
  }) => void;
}

interface AvailableSlot {
  start_time: string; // "09:00"
  end_time: string;   // "09:30"
  datetime?: string;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  doctor,
  onClose,
  onConfirm,
}) => {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Get today's date string for the "min" attribute (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setDate("");
      setSlots([]);
      setSelectedTime("");
      setReason("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (date && doctor) fetchAvailableSlots();
  }, [date, doctor]);

  const fetchAvailableSlots = async () => {
    if (!doctor) return;
    try {
      setLoadingSlots(true);
      // Assuming backend returns ALL defined slots for that day/weekday
      const res = await api.get(
        `/schedules/doctor/${doctor.doctor_id}/available-slots?date=${date}`
      );
      
      const rawSlots: AvailableSlot[] = res.data.available_slots || [];

      // LOGIC PATCH: Filter out Past Times
      const validSlots = filterPastSlots(rawSlots, date);

      setSlots(validSlots);
      
      if (validSlots.length === 0) {
        // Only show toast if it's not a loading glitch
        if (rawSlots.length > 0) {
             toast("No remaining slots for today.", { icon: "🕒" });
        } else {
             toast.error("No available schedules for this date");
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch slots:", err);
      toast.error("Could not load doctor's schedules");
    } finally {
      setLoadingSlots(false);
    }
  };

  // HELPER: Filter Logic
  const filterPastSlots = (slots: AvailableSlot[], selectedDate: string) => {
    const now = new Date();
    const isToday = selectedDate === todayStr;

    if (!isToday) return slots; // Future dates are fully valid

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return slots.filter((slot) => {
        if (!slot.start_time) return false;

        // FIX: Add default values (= 0) to satisfy TypeScript
        const parts = slot.start_time.split(":").map(Number);
        const slotHour = parts[0] ?? 0;
        const slotMinute = parts[1] ?? 0;
        
        // Strict Comparison
        if (slotHour > currentHour) return true;
        if (slotHour === currentHour && slotMinute > currentMinute) return true;
        
        return false;
    });
  };

  const handleConfirm = () => {
    if (!selectedTime || !date) {
      toast.error("Please select a schedule slot");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for your visit");
      return;
    }

    onConfirm({ date, time: selectedTime, reason });
  };

  if (!isOpen || !doctor) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Book Appointment</h2>
                <p className="text-sm text-slate-500 mt-1">
                    with <span className="font-semibold text-blue-600">Dr. {doctor.name}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                    {doctor.specializations?.name || "General Practice"}
                </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* 1. Date Selection */}
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Select Date
              </label>
              <input
                type="date"
                min={todayStr} // PREVENTS PAST DATES
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlots([]);
                  setSelectedTime("");
                }}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              />
            </div>

            {/* 2. Slot Selection */}
            <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" /> Available Time Slots
                </label>
                
                {loadingSlots ? (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : !date ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm">
                        Please select a date first
                    </div>
                ) : slots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                        <button
                        key={slot.start_time}
                        onClick={() => setSelectedTime(slot.start_time)}
                        className={`py-2 px-1 text-sm font-medium rounded-lg border transition-all ${
                            selectedTime === slot.start_time
                            ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                        >
                        {slot.start_time.slice(0, 5)}
                        </button>
                    ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
                        <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-sm font-medium">No slots available</p>
                    </div>
                )}
            </div>

            {/* 3. Reason */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Reason for Visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for booking..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
                Cancel
            </button>
            <button
                disabled={!selectedTime || !reason || loadingSlots}
                onClick={handleConfirm}
                className="flex-[2] py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
                Confirm Appointment
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;