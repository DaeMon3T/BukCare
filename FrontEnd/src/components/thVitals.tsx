import { useState, useEffect } from "react";
import { 
  Activity, 
  Scale, 
  Heart, 
  Edit2, 
  Thermometer, 
  Wind, 
  Ruler, 
  Calculator,
  Clock,
} from "lucide-react";
import api from "@/services/api";
import VitalsModal from "@/components/VitalsModal"; 

// --- TYPES ---
interface VitalsData {
  id: number;
  heart_rate: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  updated_at?: string;
}

const HealthVitals = () => {
  const [vitals, setVitals] = useState<VitalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const res = await api.get("/vitals/");
      setVitals(res.data);
    } catch (error) {
      console.error("Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (val: number | null | undefined, suffix = "") => {
    if (val === null || val === undefined || val === 0) return "--";
    return `${val}${suffix}`;
  };

  const formatBP = () => {
    if (!vitals?.bp_systolic || !vitals?.bp_diastolic) return "--/--";
    return `${vitals.bp_systolic}/${vitals.bp_diastolic}`;
  };

  const getLastUpdated = () => {
    if (!vitals?.updated_at) return "No data logged yet";
    let dateStr = vitals.updated_at;
    if (!dateStr.endsWith("Z")) {
       dateStr = dateStr.replace(" ", "T") + "Z";
    }
    
    const date = new Date(dateStr);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Manila' 
    }).format(date);
  };

  const cards = [
    { 
      label: "Heart Rate", 
      value: formatValue(vitals?.heart_rate), 
      unit: "bpm", 
      icon: Heart, 
      color: "text-rose-500", 
      bg: "bg-rose-50",
      borderColor: "border-rose-100"
    },
    { 
      label: "Blood Pressure", 
      value: formatBP(), 
      unit: "mmHg", 
      icon: Activity, 
      color: "text-emerald-500", 
      bg: "bg-sky-50",
      borderColor: "border-emerald-100"
    },
    { 
      label: "Oxygen", 
      value: formatValue(vitals?.oxygen_saturation), 
      unit: "%", 
      icon: Wind, 
      color: "text-sky-500", 
      bg: "bg-sky-50",
      borderColor: "border-sky-100"
    },
    { 
      label: "Temp", 
      value: formatValue(vitals?.temperature), 
      unit: "°C", 
      icon: Thermometer, 
      color: "text-amber-500", 
      bg: "bg-amber-50",
      borderColor: "border-amber-100"
    },
    { 
      label: "Weight", 
      value: formatValue(vitals?.weight_kg), 
      unit: "kg", 
      icon: Scale, 
      color: "text-blue-500", 
      bg: "bg-blue-50",
      borderColor: "border-blue-100"
    },
    { 
      label: "Height", 
      value: formatValue(vitals?.height_cm), 
      unit: "cm", 
      icon: Ruler, 
      color: "text-indigo-500", 
      bg: "bg-indigo-50",
      borderColor: "border-indigo-100"
    },
    { 
      label: "BMI", 
      value: formatValue(vitals?.bmi), 
      unit: "", 
      icon: Calculator, 
      color: "text-purple-500", 
      bg: "bg-purple-50",
      borderColor: "border-purple-100"
    },
  ];

  if (loading) return (
    <div className="w-full h-48 bg-slate-50 rounded-[2rem] animate-pulse flex items-center justify-center text-slate-400 font-medium mb-10">
        Loading Health Data...
    </div>
  );

  return (
    <div className="relative bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group mb-10">
      
      {/* Background Shapes */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-blue-50/50 rounded-full blur-[60px] z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-rose-50/50 rounded-full blur-[50px] z-0 pointer-events-none"></div>
      
      {/* --- HEADER --- */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Vital <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Logs</span>
          </h2>
          <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full w-fit">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated: {getLastUpdated()}</span>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 hover:border-[#00aeef] hover:text-[#00aeef] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 active:scale-95 whitespace-nowrap self-end md:self-auto"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Update Log</span>
        </button>
      </div>

      {/* --- VIEW 1: MOBILE TABLE LIST (Visible on small screens) --- */}
      <div className="relative z-10 block lg:hidden bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
         {cards.map((vital, index) => (
             <div key={index} className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                 <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${vital.bg} ${vital.color}`}>
                         <vital.icon className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold text-slate-700">{vital.label}</span>
                 </div>
                 <div className="text-right">
                     <span className="text-base font-bold text-slate-900">{vital.value}</span>
                     {vital.unit && <span className="text-xs text-slate-400 ml-1">{vital.unit}</span>}
                 </div>
             </div>
         ))}
      </div>

      {/* --- VIEW 2: DESKTOP GRID CARDS (Visible on Large screens) --- */}
      <div className="relative z-10 hidden lg:grid grid-cols-4 xl:grid-cols-7 gap-3">
        {cards.map((vital, index) => (
          <div 
            key={index} 
            className={`
                relative p-3 rounded-2xl border ${vital.borderColor} ${vital.bg} bg-opacity-40
                flex flex-col items-center justify-center text-center gap-2
                hover:scale-[1.02] transition-transform duration-300 cursor-default
            `}
          >
            <div className={`p-2 bg-white rounded-xl shadow-sm ${vital.color}`}>
                <vital.icon className="w-5 h-5" /> 
            </div>
            <div>
                <p className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-none">
                    {vital.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500/80 mt-1">
                    {vital.label} <span className="lowercase opacity-70">({vital.unit})</span>
                </p>
            </div>
          </div>
        ))}
      </div>

      <VitalsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchVitals} 
      />
      
    </div>
  );
};

export default HealthVitals;