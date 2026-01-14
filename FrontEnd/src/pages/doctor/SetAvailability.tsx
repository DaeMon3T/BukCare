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
  X,
  Info
} from "lucide-react";

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
  const [progress, setProgress] = useState(0);

  // --- LOCAL DATE HELPER ---
  const getLocalToday = () => {
      const d = new Date();
      return d.toLocaleDateString('en-CA');
  };

  const getFutureDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString('en-CA');
  };

  // --- GENERATOR STATE ---
  const [dateRange, setDateRange] = useState({
    start: getLocalToday(), 
    end: getFutureDate(1)
  });
  
  const [timeRange, setTimeRange] = useState({
    start: "09:00",
    end: "17:00",
    duration: 30 
  });

  // Default: All days selected. If user clears this, we assume "Specific Dates Only"
  const [selectedDays, setSelectedDays] = useState<number[]>([]); 
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
      
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB;
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
    setProgress(0);

    try {
      const slotsToCreate: Partial<Schedule>[] = [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      // Loop through dates
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    
        // If selectedDays is empty (length 0), we treat it as "Generate for ALL dates in range".
        // Otherwise, we strictly filter by the selected weekdays.
        const isDayIncluded = selectedDays.length === 0 || selectedDays.includes(d.getDay());

        if (isDayIncluded) {
          const baseDateStr = d.toISOString().substring(0, 10); 
          const currentSlot = new Date(`${baseDateStr}T${timeRange.start}:00`); 
          const endSlot = new Date(`${baseDateStr}T${timeRange.end}:00`);

          while (currentSlot < endSlot) {
            const slotStart = currentSlot.toTimeString().slice(0, 5); 
            
            currentSlot.setMinutes(currentSlot.getMinutes() + parseInt(String(timeRange.duration)));
            const slotEnd = currentSlot.toTimeString().slice(0, 5); 

            if (slotEnd !== "00:00" && slotEnd > timeRange.end && currentSlot > endSlot) break;

            slotsToCreate.push({
              doctor_id: Number(user.id),
              date: baseDateStr, 
              start_time: slotStart,
              end_time: slotEnd,
              is_available: true,
              notes: notes
            });
          }
        }
      }

      if (slotsToCreate.length === 0) {
        toast.error("No slots generated. Check date range.");
        setGenerating(false);
        return;
      }

      // Safety check for mass generation
      if (slotsToCreate.length > 500) {
         if(!confirm(`Warning: This will create ${slotsToCreate.length} slots. Proceed?`)) {
             setGenerating(false);
             return;
         }
      }

      // Batch Processing
      const BATCH_SIZE = 20;
      for (let i = 0; i < slotsToCreate.length; i += BATCH_SIZE) {
          const batch = slotsToCreate.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(slot => api.post("/schedules/", slot)));
          
          const percentage = Math.round(((i + BATCH_SIZE) / slotsToCreate.length) * 100);
          setProgress(Math.min(percentage, 100));
      }

      toast.success(`Success! Generated ${slotsToCreate.length} slots.`);
      fetchSchedules();

    } catch (err: any) {
      console.error(err);
      toast.error("Error creating slots.");
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleDeleteDay = async (date: string, slots: any[]) => {
    if (!window.confirm(`Delete all ${slots.length} slots for ${new Date(date).toLocaleDateString()}?`)) return;
    
    // Optimistic UI Update
    const slotIdsToRemove = new Set(slots.map(s => s.id));
    setSchedules(prev => prev.filter(s => !slotIdsToRemove.has(s.id)));

    try {
        const BATCH_SIZE = 10;
        for (let i = 0; i < slots.length; i += BATCH_SIZE) {
            const batch = slots.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(slot => api.delete(`/schedules/${slot.id}`)));
        }
        toast.success("Day cleared");
    } catch (err) {
        toast.error("Failed to clear slots");
        fetchSchedules(); 
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this slot?")) return;
    try {
        await api.delete(`/schedules/${id}`);
        setSchedules(prev => prev.filter(s => s.id !== id));
        toast.success("Slot removed");
    } catch {
        toast.error("Failed");
    }
  };

  // Group schedules
  const groupedSchedules = schedules.reduce((acc, curr) => {
    const dateKey = curr.date || "Unknown";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(curr);
    return acc;
  }, {} as Record<string, Schedule[]>);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage Availability</h1>
                <p className="text-slate-500 mt-1">Define specific dates or recurring weekly schedules.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT: GENERATOR */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Auto-Generator</h2>
                            <p className="text-xs text-slate-500">Bulk create time slots</p>
                        </div>
                    </div>

                    <form onSubmit={handleBulkGenerate} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-xs text-slate-400 mb-1 block">From</span>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} required />
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 mb-1 block">To</span>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} required />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Repeat On</label>
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                                    {selectedDays.length === 0 ? "Every day in range" : `${selectedDays.length} days selected`}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map(day => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={`w-9 h-9 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                                            selectedDays.includes(day.id)
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                    >
                                        {day.label[0]}
                                    </button>
                                ))}
                            </div>
                            {selectedDays.length === 0 && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                    <Info className="w-3 h-3"/> No days selected. Slots will be created for <b>all dates</b> above.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Hours</label>
                            <div className="flex items-center gap-2">
                                <input type="time" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={timeRange.start} onChange={e => setTimeRange({...timeRange, start: e.target.value})} required />
                                <span className="text-slate-400 font-medium">-</span>
                                <input type="time" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={timeRange.end} onChange={e => setTimeRange({...timeRange, end: e.target.value})} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slot Duration</label>
                            <select value={timeRange.duration} onChange={e => setTimeRange({...timeRange, duration: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value={15}>15 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>1 Hour</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note (Optional)</label>
                            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Clinic" value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>

                        <div className="pt-2">
                            {generating && progress > 0 && (
                                <div className="mb-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={generating} // 🚀 ENABLED even if selectedDays is empty
                                className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                    generating 
                                        ? "bg-slate-400 cursor-not-allowed" 
                                        : "bg-gradient-to-r from-blue-700 to-[#2dc7f8] hover:scale-[1.02] shadow-blue-500/30"
                                }`}
                            >
                                {generating ? <>Processing {progress}%</> : <><Plus className="w-5 h-5" /> Generate Slots</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* RIGHT: SCHEDULE LIST */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" /> Active Schedule
                  </h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{schedules.length} Slots</span>
              </div>

              {loading ? (
                  <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
                  </div>
              ) : Object.keys(groupedSchedules).length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                      <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-slate-900 font-bold mb-1">No schedule found</h3>
                      <p className="text-sm text-slate-500">Use the generator to add availability.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {Object.entries(groupedSchedules).map(([date, daySlots]) => {
                          const dateObj = new Date(date);
                          const isToday = new Date().toDateString() === dateObj.toDateString();

                          return (
                              <div key={date} className={`group bg-white rounded-2xl border transition-all duration-200 hover:shadow-md ${isToday ? 'border-blue-300 ring-4 ring-blue-50/50' : 'border-slate-200'}`}>
                                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/30 rounded-t-2xl">
                                      <div className="flex items-center gap-4">
                                          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                                              <span className="text-[10px] uppercase font-bold leading-none opacity-80">{dateObj.toLocaleDateString("en-US", { month: 'short' })}</span>
                                              <span className="text-lg font-bold leading-none mt-0.5">{dateObj.getDate()}</span>
                                          </div>
                                          <div>
                                              <h3 className={`text-base font-bold ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>{isToday ? "Today" : dateObj.toLocaleDateString("en-US", { weekday: 'long' })}</h3>
                                              <p className="text-xs font-medium text-slate-500">{daySlots.length} available slots</p>
                                          </div>
                                      </div>
                                      <button onClick={() => handleDeleteDay(date, daySlots)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-3.5 h-3.5" /> Clear Day</button>
                                  </div>
                                  <div className="p-5 flex flex-wrap gap-2.5">
                                      {daySlots.map(slot => (
                                          <div key={slot.id} className="relative group/slot flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-default hover:border-red-200 hover:shadow-sm">
                                              <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                                              {slot.notes && <span className="w-2 h-2 rounded-full bg-blue-400" title={slot.notes}></span>}
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete(slot.id); }} className="ml-1 -mr-1 p-0.5 rounded-md text-slate-300 hover:bg-red-100 hover:text-red-600 transition-colors"><X className="w-3.5 h-3.5" /></button>
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