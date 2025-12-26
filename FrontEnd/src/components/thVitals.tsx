import { useState, useEffect } from "react";
import { Activity, Moon, Scale, Heart, Edit2, X } from "lucide-react";
import api from "@/services/api";
import toast from "react-hot-toast";

interface VitalsData {
  heart_rate: number;
  weight: number;
  blood_pressure: string;
  sleep_hours: number;
}

const HealthVitals = () => {
  const [vitals, setVitals] = useState<VitalsData>({
    heart_rate: 0,
    weight: 0,
    blood_pressure: "0/0",
    sleep_hours: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<VitalsData>(vitals);

  useEffect(() => {
    fetchVitals();
  }, []);

  const fetchVitals = async () => {
    try {
      const res = await api.get("/vitals/");
      setVitals(res.data);
      setFormData(res.data);
    } catch (error) {
      console.error("Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await api.post("/vitals/", formData);
      setVitals(res.data);
      setIsEditing(false);
      toast.success("Vitals updated! 💪");
    } catch (error) {
      toast.error("Failed to update vitals");
    }
  };

  const cards = [
    { label: "Heart Rate", value: vitals.heart_rate, unit: "bpm", icon: Heart, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Weight", value: vitals.weight, unit: "kg", icon: Scale, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Sleep", value: vitals.sleep_hours, unit: "hr", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Blood Pressure", value: vitals.blood_pressure, unit: "mmHg", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  if (loading) return <div className="p-6 text-center text-slate-400">Loading vitals...</div>;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8 relative group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" /> Your Vitals
        </h2>
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((vital, index) => (
          <div key={index} className={`p-4 rounded-2xl border border-slate-100 ${vital.bg} flex flex-col items-center text-center transition-transform`}>
            <vital.icon className={`w-6 h-6 ${vital.color} mb-2`} />
            <p className="text-2xl font-bold text-slate-800">{vital.value || "--"}</p>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{vital.label} ({vital.unit})</p>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Update Health Data</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
                <input 
                  type="number" 
                  value={formData.heart_rate} 
                  onChange={e => setFormData({...formData, heart_rate: Number(e.target.value)})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input 
                  type="number" 
                  value={formData.weight} 
                  onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (sys/dia)</label>
                <input 
                  type="text" 
                  value={formData.blood_pressure} 
                  placeholder="120/80"
                  onChange={e => setFormData({...formData, blood_pressure: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sleep (hours)</label>
                <input 
                  type="number" 
                  value={formData.sleep_hours} 
                  onChange={e => setFormData({...formData, sleep_hours: Number(e.target.value)})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              
              <button 
                onClick={handleUpdate}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all mt-4 shadow-lg hover:shadow-blue-500/30"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthVitals;