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
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Asia/Manila",
    }).format(new Date(dateStr));
  };

  const getBMILabel = (bmi: number | null) => {
    if (!bmi || bmi === 0) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Normal", color: "text-emerald-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-rose-500" };
  };

  const bmiLabel = getBMILabel(vitals?.bmi ?? null);

  const cards = [
    {
      label: "Heart Rate",
      value: formatValue(vitals?.heart_rate),
      unit: "bpm",
      icon: Heart,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      borderColor: "border-rose-100",
    },
    {
      label: "Blood Pressure",
      value: formatBP(),
      unit: "mmHg",
      icon: Activity,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      label: "Oxygen",
      value: formatValue(vitals?.oxygen_saturation),
      unit: "%",
      icon: Wind,
      iconColor: "text-sky-500",
      iconBg: "bg-sky-50",
      borderColor: "border-sky-100",
    },
    {
      label: "Temperature",
      value: formatValue(vitals?.temperature),
      unit: "°C",
      icon: Thermometer,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      borderColor: "border-amber-100",
    },
    {
      label: "Weight",
      value: formatValue(vitals?.weight_kg),
      unit: "kg",
      icon: Scale,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      label: "Height",
      value: formatValue(vitals?.height_cm),
      unit: "cm",
      icon: Ruler,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-50",
      borderColor: "border-indigo-100",
    },
    {
      label: "BMI",
      value: formatValue(vitals?.bmi),
      unit: "",
      icon: Calculator,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-50",
      borderColor: "border-purple-100",
    },
  ];

  if (loading)
    return (
      <div className="w-full bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="h-5 w-28 bg-slate-100 rounded-lg mb-2" />
            <div className="h-3.5 w-44 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-9 w-28 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">Health Vitals</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">{getLastUpdated()}</span>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" />
          Update Log
        </button>
      </div>

      {/* ─── VITALS GRID ─── */}
      <div className="p-4">
        {/* Top row: 4 key vitals in a 2x2 on mobile, 4-col on larger */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {cards.slice(0, 4).map((vital, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl border ${vital.borderColor} p-4 flex flex-col gap-3 hover:shadow-sm transition-all`}
            >
              <div className={`w-9 h-9 rounded-xl ${vital.iconBg} flex items-center justify-center flex-shrink-0`}>
                <vital.icon className={`w-4.5 h-4.5 ${vital.iconColor}`} style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 leading-none tracking-tight">
                  {vital.value}
                  {vital.unit && (
                    <span className="text-xs font-semibold text-slate-400 ml-1">{vital.unit}</span>
                  )}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">{vital.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row: 3 remaining vitals in a row */}
        <div className="grid grid-cols-3 gap-3">
          {cards.slice(4).map((vital, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl border ${vital.borderColor} p-4 flex flex-col gap-2.5 hover:shadow-sm transition-all`}
            >
              <div className={`w-8 h-8 rounded-xl ${vital.iconBg} flex items-center justify-center flex-shrink-0`}>
                <vital.icon className={`${vital.iconColor}`} style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 leading-none tracking-tight">
                  {vital.value}
                  {vital.unit && (
                    <span className="text-[10px] font-semibold text-slate-400 ml-1">{vital.unit}</span>
                  )}
                </p>
                {/* BMI label badge */}
                {vital.label === "BMI" && bmiLabel ? (
                  <p className={`text-[10px] font-bold mt-1 ${bmiLabel.color}`}>{bmiLabel.label}</p>
                ) : (
                  <p className="text-[11px] font-semibold text-slate-400 mt-1">{vital.label}</p>
                )}
              </div>
            </div>
          ))}
        </div>
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