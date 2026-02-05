import React, { useState, useEffect } from "react";
import { X, Activity, Thermometer, Wind, Scale, Ruler, Heart } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VitalsModal: React.FC<VitalsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Form State matches your new Backend Schema
  const [formData, setFormData] = useState({
    heart_rate: "",
    bp_systolic: "",
    bp_diastolic: "",
    temperature: "",
    oxygen_saturation: "",
    weight_kg: "",
    height_cm: "",
    bmi: "" // Read-only for display
  });

  // 🧮 AUTO-CALCULATE BMI ON FRONTEND (For instant feedback)
  useEffect(() => {
    const w = parseFloat(formData.weight_kg);
    const h = parseFloat(formData.height_cm);

    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      // BMI = kg / m²
      const bmiValue = (w / (heightInMeters * heightInMeters)).toFixed(1);
      setFormData(prev => ({ ...prev, bmi: bmiValue }));
    } else {
      setFormData(prev => ({ ...prev, bmi: "" }));
    }
  }, [formData.weight_kg, formData.height_cm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Prepare payload (convert strings to numbers)
      const payload = {
        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
        bp_systolic: formData.bp_systolic ? parseInt(formData.bp_systolic) : null,
        bp_diastolic: formData.bp_diastolic ? parseInt(formData.bp_diastolic) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        // We DO NOT send BMI. The backend calculates it to prevent cheating.
      };

      await api.post("/vitals", payload);
      toast.success("Health logs updated!");
      onSuccess(); // Refresh the dashboard
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vitals.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-rose-500" /> Log Vitals
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-500"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. HEART RATE */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Heart Rate (bpm)</label>
                <div className="relative group">
                    <Heart className="absolute left-3 top-3.5 w-4 h-4 text-rose-400 group-focus-within:text-rose-600 transition-colors" />
                    <input type="number" placeholder="72" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                        value={formData.heart_rate} onChange={e => setFormData({...formData, heart_rate: e.target.value})}
                    />
                </div>
            </div>

            {/* 2. BLOOD PRESSURE (Split Input) */}
            <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Blood Pressure (Sys / Dia)</label>
                <div className="flex gap-4 items-center">
                    <input type="number" placeholder="120" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center"
                        value={formData.bp_systolic} onChange={e => setFormData({...formData, bp_systolic: e.target.value})}
                    />
                    <span className="text-xl text-slate-300 font-light">/</span>
                    <input type="number" placeholder="80" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center"
                        value={formData.bp_diastolic} onChange={e => setFormData({...formData, bp_diastolic: e.target.value})}
                    />
                </div>
            </div>

            {/* 3. OXYGEN */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Oxygen (SpO2 %)</label>
                <div className="relative group">
                    <Wind className="absolute left-3 top-3.5 w-4 h-4 text-sky-400 group-focus-within:text-sky-600 transition-colors" />
                    <input type="number" placeholder="98" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
                        value={formData.oxygen_saturation} onChange={e => setFormData({...formData, oxygen_saturation: e.target.value})}
                    />
                </div>
            </div>

            {/* 4. TEMP */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Temperature (°C)</label>
                <div className="relative group">
                    <Thermometer className="absolute left-3 top-3.5 w-4 h-4 text-amber-400 group-focus-within:text-amber-600 transition-colors" />
                    <input type="number" step="0.1" placeholder="36.5" className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                        value={formData.temperature} onChange={e => setFormData({...formData, temperature: e.target.value})}
                    />
                </div>
            </div>

            {/* --- BMI SECTION (Auto-Calc) --- */}
            <div className="md:col-span-3 grid grid-cols-3 gap-6 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mt-2">
                
                {/* WEIGHT */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                    <div className="relative group">
                        <Scale className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="number" step="0.1" placeholder="70" className="w-full pl-10 p-3 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})}
                        />
                    </div>
                </div>

                {/* HEIGHT */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Height (cm)</label>
                    <div className="relative group">
                        <Ruler className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input type="number" step="0.1" placeholder="175" className="w-full pl-10 p-3 bg-white border border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})}
                        />
                    </div>
                </div>

                {/* BMI (READ ONLY) */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#00aeef] uppercase">BMI Result</label>
                    <div className="relative">
                        <input type="text" readOnly placeholder="---" 
                            className="w-full p-3 bg-blue-100/50 border border-blue-200 text-blue-700 font-bold text-center rounded-xl cursor-not-allowed select-none"
                            value={formData.bmi}
                        />
                    </div>
                </div>
            </div>

          </div>

          <button disabled={loading} className="w-full py-4 bg-[#00aeef] hover:bg-[#009bd5] text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:translate-y-0 disabled:shadow-none">
            {loading ? "Saving..." : "Log Vitals"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VitalsModal;