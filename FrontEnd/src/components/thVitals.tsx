import { useState, useEffect } from "react";
import { Activity, Moon, Scale, Heart, Edit2, X, Save } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

// --- TYPES ---
interface VitalsData {
  heart_rate: number;
  weight: number;
  blood_pressure: string;
  sleep_hours: number;
}

// Internal State for Form (Strings allow empty inputs)
interface VitalsFormState {
  heart_rate: string;
  weight: string;
  blood_pressure: string;
  sleep_hours: string;
}

const HealthVitals = () => {
  // Data from API
  const [vitals, setVitals] = useState<VitalsData>({
    heart_rate: 0,
    weight: 0,
    blood_pressure: "--/--",
    sleep_hours: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State (Strings)
  const [formData, setFormData] = useState<VitalsFormState>({
    heart_rate: "",
    weight: "",
    blood_pressure: "",
    sleep_hours: ""
  });

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const res = await api.get("/vitals/");
      const data = res.data;
      setVitals(data);
      
      // Initialize form with string values for editing
      setFormData({
        heart_rate: data.heart_rate ? data.heart_rate.toString() : "",
        weight: data.weight ? data.weight.toString() : "",
        blood_pressure: data.blood_pressure || "",
        sleep_hours: data.sleep_hours ? data.sleep_hours.toString() : ""
      });
    } catch (error) {
      console.error("Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      // Convert strings back to numbers for API
      const payload = {
        heart_rate: Number(formData.heart_rate) || 0,
        weight: Number(formData.weight) || 0,
        blood_pressure: formData.blood_pressure,
        sleep_hours: Number(formData.sleep_hours) || 0
      };

      const res = await api.post("/vitals/", payload);
      setVitals(res.data);
      setIsEditing(false);
      toast.success("Vitals updated successfully!");
    } catch (error) {
      toast.error("Failed to update vitals");
    } finally {
      setIsSaving(false);
    }
  };

  // Card Configuration
  const cards = [
    { 
      label: "Heart Rate", 
      value: vitals.heart_rate, 
      unit: "bpm", 
      icon: Heart, 
      color: "text-rose-500", 
      bg: "bg-rose-50",
      borderColor: "border-rose-100"
    },
    { 
      label: "Weight", 
      value: vitals.weight, 
      unit: "kg", 
      icon: Scale, 
      color: "text-[#00aeef]", // BukCare Blue
      bg: "bg-blue-50",
      borderColor: "border-blue-100"
    },
    { 
      label: "Sleep", 
      value: vitals.sleep_hours, 
      unit: "hr", 
      icon: Moon, 
      color: "text-indigo-500", 
      bg: "bg-indigo-50",
      borderColor: "border-indigo-100"
    },
    { 
      label: "Blood Pressure", 
      value: vitals.blood_pressure, 
      unit: "mmHg", 
      icon: Activity, 
      color: "text-emerald-500", 
      bg: "bg-emerald-50",
      borderColor: "border-emerald-100"
    },
  ];

  if (loading) return (
    <div className="w-full h-48 bg-slate-50 rounded-[2rem] animate-pulse flex items-center justify-center text-slate-400">
        Loading Health Data...
    </div>
  );

  return (
    <div className="relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden group mb-10">
      
      {/* --- Abstract Background Shapes (Matches SignUp.tsx) --- */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 bg-blue-50/50 rounded-full blur-[60px] z-0 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Static <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Vitals.</span>
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">Please update it regularly</p>
        </div>

        <button 
          onClick={() => setIsEditing(true)}
          className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-[#00aeef] hover:text-[#00aeef] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 active:scale-95"
        >
          <Edit2 className="w-4 h-4" />
          <span>Update</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((vital, index) => (
          <div 
            key={index} 
            className={`
                relative p-5 rounded-3xl border ${vital.borderColor} ${vital.bg} bg-opacity-40
                flex flex-col items-center justify-center text-center gap-3
                hover:scale-[1.02] transition-transform duration-300 cursor-default
            `}
          >
            <div className={`p-3 bg-white rounded-2xl shadow-sm ${vital.color}`}>
                <vital.icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-slate-800 tracking-tight">
                    {vital.value || <span className="text-slate-400 text-lg">--</span>}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500/80 mt-1">
                    {vital.label} <span className="lowercase opacity-70">({vital.unit})</span>
                </p>
            </div>
          </div>
        ))}
      </div>

      {/* --- EDIT MODAL --- */}
      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" 
            onClick={() => setIsEditing(false)}
          />

          {/* Modal Content */}
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 relative z-10 animate-in zoom-in-95 duration-200 border border-slate-100">
            
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Update Health Data</h3>
                    <p className="text-slate-500 text-sm">Keep your records up to date.</p>
                </div>
                <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                >
                    <X className="w-5 h-5"/>
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Heart Rate */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Heart Rate</label>
                    <div className="relative group">
                        <input 
                            type="number" 
                            value={formData.heart_rate}
                            onChange={e => setFormData({...formData, heart_rate: e.target.value})}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                        <Heart className="w-4 h-4 text-rose-400 absolute left-3.5 top-3.5 group-focus-within:text-rose-500 transition-colors" />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">bpm</span>
                    </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Weight</label>
                    <div className="relative group">
                        <input 
                            type="number" 
                            value={formData.weight}
                            onChange={e => setFormData({...formData, weight: e.target.value})}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                        <Scale className="w-4 h-4 text-[#00aeef]/70 absolute left-3.5 top-3.5 group-focus-within:text-[#00aeef] transition-colors" />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">kg</span>
                    </div>
                </div>

                {/* Blood Pressure */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Blood Pressure</label>
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={formData.blood_pressure}
                            onChange={e => setFormData({...formData, blood_pressure: e.target.value})}
                            placeholder="120/80"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                        <Activity className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5 group-focus-within:text-emerald-500 transition-colors" />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">mmHg</span>
                    </div>
                </div>

                {/* Sleep */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-500 ml-1">Sleep</label>
                    <div className="relative group">
                        <input 
                            type="number" 
                            value={formData.sleep_hours}
                            onChange={e => setFormData({...formData, sleep_hours: e.target.value})}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/10 transition-all font-semibold text-slate-700 placeholder:text-slate-300"
                        />
                        <Moon className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                        <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">hrs</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleUpdate}
                disabled={isSaving}
                className="w-full mt-8 flex items-center justify-center gap-3 py-4 bg-[#00aeef] text-white font-bold rounded-xl hover:bg-[#009bc5] hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        Save Updates
                    </>
                )}
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default HealthVitals;