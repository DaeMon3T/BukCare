import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { 
  Calendar,
  Plus, 
  Trash2, 
  RefreshCw,
  CalendarDays,
  X
} from "lucide-react";

// 1. Strict Interface
interface Schedule {
  id: number;
  doctor_id: number;
  date: string; 
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes?: string;
}

const DoctorSetAvailability = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // --- BULK GENERATOR STATE ---
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0], 
    end: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0] 
  });
  
  const [timeRange, setTimeRange] = useState({
    start: "09:00",
    end: "17:00",
    duration: 60 
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); 
  const [notes, setNotes] = useState("");

  const daysOfWeek = [
    { id: 0, label: "Sun" },
    { id: 1, label: "Mon" },
    { id: 2, label: "Tue" },
    { id: 3, label: "Wed" },
    { id: 4, label: "Thu" },
    { id: 5, label: "Fri" },
    { id: 6, label: "Sat" },
  ];

  // --- FETCH SCHEDULES ---
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get("/schedules");
      
      const data = res.data as Schedule[];
      
      // SORTING FIX: Sort by Date first, THEN by Start Time
      const sorted = data.sort((a, b) => {
        // 1. Compare Dates
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        if (dateA !== dateB) return dateA - dateB;

        // 2. If dates are equal, compare Start Times
        // "09:00" comes before "10:00" string-wise, so localeCompare works perfectly
        return a.start_time.localeCompare(b.start_time);
      });
      
      setSchedules(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // --- BULK GENERATION LOGIC ---
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setGenerating(true);

    try {
      // Use Partial<Schedule> since we don't have 'id' yet
      const slotsToCreate: Partial<Schedule>[] = [];
      
      // Ensure strings are valid
      const startStr = dateRange.start || new Date().toISOString().substring(0, 10);
      const endStr = dateRange.end || new Date().toISOString().substring(0, 10);

      const startDate = new Date(startStr);
      const endDate = new Date(endStr);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (selectedDays.includes(d.getDay())) {
          
          const currentSlot = new Date(`2000-01-01T${timeRange.start}:00`); 
          const endSlot = new Date(`2000-01-01T${timeRange.end}:00`);

          while (currentSlot < endSlot) {
            const slotStart = currentSlot.toTimeString().slice(0, 5); 
            
            currentSlot.setMinutes(currentSlot.getMinutes() + timeRange.duration);
            const slotEnd = currentSlot.toTimeString().slice(0, 5); 

            if (currentSlot > endSlot && slotEnd !== "00:00" && slotEnd > timeRange.end) break;

            // KEY FIX HERE: Use .substring(0, 10) instead of .split('T')[0]
            // This guarantees a string and satisfies TypeScript
            slotsToCreate.push({
              doctor_id: Number(user.id),
              date: d.toISOString().substring(0, 10), 
              start_time: slotStart,
              end_time: slotEnd,
              is_available: true,
              notes: notes
            });
          }
        }
      }

      if (slotsToCreate.length === 0) {
        toast.error("No slots generated. Check settings.");
        setGenerating(false);
        return;
      }

      if (slotsToCreate.length > 150) {
        if(!confirm(`Generate ${slotsToCreate.length} slots? This might take a moment.`)) {
            setGenerating(false);
            return;
        }
      }

      await Promise.all(slotsToCreate.map(slot => api.post("/schedules/", slot)));

      toast.success(`Generated ${slotsToCreate.length} slots!`);
      fetchSchedules();

    } catch (err: any) {
      console.error(err);
      toast.error("Error creating slots.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this slot?")) return;
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success("Slot removed");
    } catch {
      toast.error("Failed to remove slot");
    }
  };

  // Group schedules by date
  const groupedSchedules = schedules.reduce((acc, curr) => {
    const dateKey = curr.date || "Unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {} as Record<string, Schedule[]>);

  const handleDeleteDay = async (date: string, slots: any[]) => {
    if (!window.confirm(`Delete all ${slots.length} slots for ${new Date(date).toLocaleDateString()}?`)) return;
    
    // UI: Optimistic update (remove them from screen immediately)
    const slotIdsToRemove = new Set(slots.map(s => s.id));
    setSchedules(prev => prev.filter(s => !slotIdsToRemove.has(s.id)));

    try {
        // Loop through and delete each slot using the endpoint WE KNOW works
        await Promise.all(slots.map(slot => api.delete(`/schedules/${slot.id}`)));
        toast.success("Day schedule cleared");
    } catch (err) {
        console.error(err);
        toast.error("Failed to clear some slots");
        fetchSchedules(); // Re-fetch if something failed, just to be safe
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Manage Availability</h1>
            <p className="text-slate-500 mt-1">Automate your schedule.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: BULK GENERATOR FORM */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                    <div className="flex items-center gap-2 mb-6 text-blue-600">
                        <RefreshCw className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Auto-Generator</h2>
                    </div>

                    <form onSubmit={handleBulkGenerate} className="space-y-5">
                        {/* 1. Date Range */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-xs text-slate-400 mb-1 block">From</span>
                                    <input 
                                        type="date" 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({...dateRange, start: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 mb-1 block">To</span>
                                    <input 
                                        type="date" 
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({...dateRange, end: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Days of Week */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat On</label>
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-9 h-9 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                                            selectedDays.includes(day.id)
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {day.label[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Time Range */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Hours</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="time" 
                                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    value={timeRange.start}
                                    onChange={e => setTimeRange({...timeRange, start: e.target.value})}
                                    required
                                />
                                <span className="text-slate-400">-</span>
                                <input 
                                    type="time" 
                                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    value={timeRange.end}
                                    onChange={e => setTimeRange({...timeRange, end: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* 4. Notes */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="e.g., Clinic Hours"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Submit */}
                        <button 
                            type="submit" 
                            disabled={generating || selectedDays.length === 0}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                generating 
                                    ? "bg-slate-400 cursor-not-allowed" 
                                    : "bg-gradient-to-r from-blue-700 to-[#2dc7f8] hover:scale-[1.02] shadow-blue-500/30"
                            }`}
                        >
                            {generating ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                            {generating ? "Generating..." : "Generate Slots"}
                        </button>
                    </form>
                </div>
            </div>

            {/* RIGHT: CURRENT SCHEDULE LIST (Grouped) */}
            <div className="lg:col-span-2 space-y-4">
    
              {/* Header: Compact & Clean */}
              <div className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      Upcoming Schedule
                  </h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                      {schedules.length} Slots Total
                  </span>
              </div>

              {/* Content */}
              {loading ? (
                  <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
                  </div>
              ) : Object.keys(groupedSchedules).length === 0 ? (
                  <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center">
                      <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 font-medium">No schedule set.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {Object.entries(groupedSchedules).map(([date, daySlots]) => {
                          const dateObj = new Date(date);
                          const isToday = new Date().toDateString() === dateObj.toDateString();

                          return (
                              <div key={date} className={`group bg-white rounded-xl border transition-all hover:shadow-md ${isToday ? 'border-blue-300 shadow-blue-100' : 'border-slate-200'}`}>
                                  
                                  {/* Compact Row Header */}
                                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                                      <div className="flex items-center gap-3">
                                          {/* Date Badge */}
                                          <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                                              <span className="text-[9px] uppercase font-bold leading-none">{dateObj.toLocaleDateString("en-US", { month: 'short' })}</span>
                                              <span className="text-base font-bold leading-none mt-0.5">{dateObj.getDate()}</span>
                                          </div>
                                          
                                          {/* Day Name */}
                                          <div>
                                              <h3 className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-slate-800'}`}>
                                                  {isToday ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: 'long' })}
                                              </h3>
                                              <p className="text-[11px] font-medium text-slate-400">
                                                  {daySlots.length} slots
                                              </p>
                                          </div>
                                      </div>

                                      {/* DELETE DAY BUTTON */}
                                      <button 
                                          onClick={() => handleDeleteDay(date, daySlots)}
                                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                          title="Clear entire day"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                                  
                                  {/* PILL LAYOUT (Saves Space!) */}
                                  <div className="p-3 flex flex-wrap gap-2">
                                      {daySlots.map(slot => (
                                          <div 
                                              key={slot.id} 
                                              className="relative group/slot flex items-center gap-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-default"
                                          >
                                              {/* Time */}
                                              <span>
                                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                              </span>
                                              
                                              {/* Notes Indicator (if any) */}
                                              {slot.notes && (
                                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 group-hover/slot:bg-red-400" title={slot.notes}></span>
                                              )}

                                              {/* Delete 'x' (appears on hover) */}
                                              <button 
                                                  onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }}
                                                  className="ml-1 -mr-1 p-0.5 rounded-md hover:bg-red-200 text-red-400 hover:text-red-700 opacity-0 group-hover/slot:opacity-100 transition-opacity"
                                              >
                                                  <X className="w-3 h-3" />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSetAvailability;