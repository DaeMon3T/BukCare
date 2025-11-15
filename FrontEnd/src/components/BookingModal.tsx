import React, { useState, useEffect } from "react";
import type { Doctor } from "./DoctorCard";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import toast from "react-hot-toast";

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
  start_time: string;
  end_time: string;
  datetime: string;
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

  useEffect(() => {
    if (date && doctor) fetchAvailableSlots();
  }, [date, doctor]);

  const fetchAvailableSlots = async () => {
    if (!doctor) return;
    try {
      setLoadingSlots(true);
      const res = await api.get(
        `/schedules/doctor/${doctor.doctor_id}/available-slots?date=${date}`
      );
      setSlots(res.data.available_slots || []);
      if (res.data.available_slots.length === 0)
        toast.error("No available schedules for this date");
    } catch (err: any) {
      console.error("❌ Failed to fetch slots:", err);
      toast.error("Could not load doctor's schedules");
    } finally {
      setLoadingSlots(false);
    }
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
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>

          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Book Appointment with {doctor.name}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Specialization: {doctor.specialization?.name || "General Practice"}
          </p>

          {/* Select Date */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlots([]);
                setSelectedTime("");
              }}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          {/* Show available slots */}
          {loadingSlots ? (
            <p className="text-sm text-gray-500 text-center mb-3">
              Loading available slots...
            </p>
          ) : (
            date && (
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">
                  Available Slots
                </label>
                {slots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {slots.map((slot) => (
                      <button
                        key={slot.start_time}
                        onClick={() => setSelectedTime(slot.start_time)}
                        className={`p-2 rounded-lg text-sm border ${
                          selectedTime === slot.start_time
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {slot.start_time} - {slot.end_time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No available time slots for this date.
                  </p>
                )}
              </div>
            )
          )}

          {/* Reason for Visit */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 block mb-1">
              Reason for Visit
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your concern..."
              className="w-full border p-2 rounded-lg h-24 resize-none"
            />
          </div>

          <button
            disabled={!selectedTime || !reason}
            onClick={handleConfirm}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm Appointment
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingModal;
