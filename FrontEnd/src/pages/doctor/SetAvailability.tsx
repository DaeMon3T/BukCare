import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { 
  Calendar,
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw,
  CalendarDays
} from "lucide-react";

// ✅ 1. Strict Interface
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
      
      // Handle sorting safely
      const sorted = data.sort((a, b) => {
        const dateA = new Date(a.date || "").getTime();
        const dateB = new Date(b.date || "").getTime();
        return dateA - dateB;
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

            // ✅ KEY FIX HERE: Use .substring(0, 10) instead of .split('T')[0]
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
                                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] shadow-blue-500/30"
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
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-purple-600" />
                        Upcoming Schedule
                    </h2>
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {schedules.length} Slots
                    </span>
                </div>

                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>)}
                    </div>
                ) : Object.keys(groupedSchedules).length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No availability set</h3>
                        <p className="text-slate-500">Use the generator to set your hours.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(groupedSchedules).map(([date, daySlots]) => (
                            <div key={date} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                {/* Card Header */}
                                <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">
                                        {new Date(date).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </h3>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                        {daySlots.length} Slots
                                    </span>
                                </div>
                                
                                {/* Slots List */}
                                <div className="p-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {daySlots.map(slot => (
                                        <div key={slot.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700">
                                                        {slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}
                                                    </p>
                                                    {slot.notes && <p className="text-xs text-slate-400">{slot.notes}</p>}
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleDelete(slot.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Remove slot"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSetAvailability;