import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Plus,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface DaySchedule {
  day: string;
  is_available: boolean;
  time_slots: TimeSlot[];
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SetAvailability: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map((day) => ({
      day,
      is_available: false,
      time_slots: [],
    }))
  );

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const toggleDayAvailability = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((item, index) =>
        index === dayIndex
          ? {
              ...item,
              is_available: !item.is_available,
              time_slots: !item.is_available ? [] : item.time_slots,
            }
          : item
      )
    );
  };

  const addTimeSlot = (dayIndex: number) => {
    setSchedule((prev) =>
      prev.map((item, index) =>
        index === dayIndex
          ? {
              ...item,
              time_slots: [
                ...item.time_slots,
                {
                  id: `slot-${Date.now()}`,
                  start_time: "09:00",
                  end_time: "10:00",
                },
              ],
            }
          : item
      )
    );
  };

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    setSchedule((prev) =>
      prev.map((item, index) =>
        index === dayIndex
          ? {
              ...item,
              time_slots: item.time_slots.filter((slot) => slot.id !== slotId),
            }
          : item
      )
    );
  };

  const updateTimeSlot = (
    dayIndex: number,
    slotId: string,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((item, index) =>
        index === dayIndex
          ? {
              ...item,
              time_slots: item.time_slots.map((slot) =>
                slot.id === slotId ? { ...slot, [field]: value } : slot
              ),
            }
          : item
      )
    );
  };

  const handleSaveSchedule = () => {
    // UI Demo: Show success message
    console.log("Saving schedule:", schedule);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    
    // TODO: Add API call here
    // Example:
    // await axios.post(`${API_BASE_URL}/doctor/availability`, { schedule });
  };

  const copyToAllDays = (dayIndex: number) => {
    const sourceDay = schedule[dayIndex];
    if (!sourceDay) {
      console.warn("Source day not found for index:", dayIndex);
      return;
    }
    if (sourceDay.time_slots.length === 0) {
      alert("No time slots to copy!");
      return;
    }

    setSchedule((prev) =>
      prev.map((item, index) =>
        index !== dayIndex && item.is_available
          ? {
              ...item,
              time_slots: sourceDay.time_slots.map((slot) => ({
                ...slot,
                id: `slot-${Date.now()}-${index}`,
              })),
            }
          : item
      )
    );
  };

  const quickSetBusinessHours = () => {
    const businessHours = [
      { start_time: "09:00", end_time: "12:00" },
      { start_time: "13:00", end_time: "17:00" },
    ];

    setSchedule((prev) =>
      prev.map((item, index) =>
        index < 5 // Monday to Friday
          ? {
              ...item,
              is_available: true,
              time_slots: businessHours.map((slot, slotIndex) => ({
                id: `slot-${Date.now()}-${index}-${slotIndex}`,
                ...slot,
              })),
            }
          : item
      )
    );
  };

  const clearAllSchedule = () => {
    if (window.confirm("Are you sure you want to clear all availability?")) {
      setSchedule(
        DAYS_OF_WEEK.map((day) => ({
          day,
          is_available: false,
          time_slots: [],
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Set Your Availability
          </h1>
          <p className="text-gray-600">
            Manage your weekly schedule and available time slots for appointments
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">
              Availability saved successfully!
            </p>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={quickSetBusinessHours}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Set Business Hours (Mon-Fri, 9AM-5PM)
            </button>
            <button
              onClick={clearAllSchedule}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800 font-medium mb-1">
              💡 UI Demo Mode
            </p>
            <p className="text-sm text-blue-700">
              This is a UI-only demonstration. API integration can be added later.
              Changes are saved locally for this session.
            </p>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="space-y-4">
          {schedule.map((daySchedule, dayIndex) => (
            <motion.div
              key={daySchedule.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={daySchedule.is_available}
                      onChange={() => toggleDayAvailability(dayIndex)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-lg font-semibold text-gray-800">
                      {daySchedule.day}
                    </span>
                  </label>
                  {!daySchedule.is_available && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Unavailable
                    </span>
                  )}
                  {daySchedule.is_available &&
                    daySchedule.time_slots.length === 0 && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        No time slots
                      </span>
                    )}
                </div>

                {daySchedule.is_available && (
                  <div className="flex gap-2">
                    {daySchedule.time_slots.length > 0 && (
                      <button
                        onClick={() => copyToAllDays(dayIndex)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Copy to other days
                      </button>
                    )}
                    <button
                      onClick={() => addTimeSlot(dayIndex)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Time Slot
                    </button>
                  </div>
                )}
              </div>

              {/* Time Slots */}
              {daySchedule.is_available && daySchedule.time_slots.length > 0 && (
                <div className="space-y-3 pl-9">
                  {daySchedule.time_slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateTimeSlot(
                              dayIndex,
                              slot.id,
                              "start_time",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateTimeSlot(
                              dayIndex,
                              slot.id,
                              "end_time",
                              e.target.value
                            )
                          }
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => removeTimeSlot(dayIndex, slot.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSchedule}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Availability
          </button>
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Availability Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule
              .filter((day) => day.is_available && day.time_slots.length > 0)
              .map((day) => (
                <div
                  key={day.day}
                  className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg"
                >
                  <p className="font-semibold text-gray-800 mb-2">
                    {day.day}
                  </p>
                  <div className="space-y-1">
                    {day.time_slots.map((slot) => (
                      <p key={slot.id} className="text-sm text-gray-600">
                        {slot.start_time} - {slot.end_time}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            {schedule.filter(
              (day) => day.is_available && day.time_slots.length > 0
            ).length === 0 && (
              <p className="text-gray-500 col-span-full text-center py-4">
                No availability set yet. Add time slots to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetAvailability;