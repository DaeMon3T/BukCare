import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Mail, Stethoscope } from "lucide-react";

export interface Doctor {
  doctor_id: number;
  avatar?: string;
  name: string;
  specializations?: string[] | string; 
  address: string;
  email: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onBook?: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const navigate = useNavigate();

  const avatarSrc = doctor.avatar && doctor.avatar.trim() !== "" 
    ? doctor.avatar 
    : "/default-avatar.png";

  const specializationLabel = React.useMemo(() => {
    const specs = doctor.specializations;
    if (!specs) return "General Practice";
    if (Array.isArray(specs)) return specs.join(", ");
    if (typeof specs === "string") {
        try {
            if (specs.startsWith("[") && specs.endsWith("]")) {
                const parsed = JSON.parse(specs);
                if (Array.isArray(parsed)) return parsed.join(", ");
            }
        } catch (e) {}
        return specs.replace(/[\[\]"]/g, '');
    }
    return String(specs);
  }, [doctor.specializations]);

  return (
    <div className="group relative bg-white rounded-2xl md:rounded-[2rem] shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-slate-100 flex flex-col h-full">
      
      {/* 1. HEADER: Smaller on mobile (h-24), larger on desktop (h-32) */}
      <div className="relative h-24 md:h-32 bg-gradient-to-r from-blue-700 to-[#2dc7f8] flex justify-center items-start pt-4 md:pt-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="flex items-center gap-1.5 md:gap-2 text-white/90 z-10">
            <div className="bg-white/20 p-1 md:p-1.5 rounded-full backdrop-blur-sm">
                <Stethoscope className="w-3 h-3 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="font-bold text-xs md:text-sm tracking-wide">BukCare</span>
                <span className="text-[8px] md:text-[10px] opacity-80 uppercase tracking-wider">Doctor</span>
            </div>
        </div>
      </div>

      {/* 2. AVATAR: Smaller on mobile (w-20), larger on desktop (w-28) */}
      <div className="relative flex justify-center -mt-10 md:-mt-16 z-20">
        <div className="p-1 md:p-1.5 bg-white rounded-full shadow-md">
            <img
            src={avatarSrc}
            alt={doctor.name}
            className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-2 md:border-4 border-teal-50 bg-slate-100"
            onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
            }}
            />
        </div>
      </div>

      {/* 3. DETAILS: Tighter padding on mobile */}
      <div className="flex-1 px-3 md:px-6 pt-3 md:pt-4 pb-4 md:pb-6 text-center flex flex-col">
        {/* Name */}
        <h3 className="text-base md:text-xl font-bold text-slate-800 mb-1 leading-tight">
            {doctor.name}
        </h3>
        
        {/* Label */}
        <div className="mb-4 md:mb-6">
            <span className="text-blue-600 font-medium text-[10px] md:text-sm bg-teal-50 inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full">
            {specializationLabel}
            </span>
        </div>

        {/* Info Rows: Smaller text (text-xs) on mobile */}
        <div className="space-y-2 md:space-y-4 text-left mt-auto">
          <div className="flex items-start gap-2 md:gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
            <MapPin className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
                <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Address</p>
                <p className="text-xs md:text-sm font-medium leading-tight truncate md:whitespace-normal line-clamp-2">
                    {doctor.address || "Not Provided"}
                </p>
            </div>
          </div>

          <div className="flex items-start gap-2 md:gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
            <Mail className="w-3.5 h-3.5 md:w-5 md:h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <p className="hidden md:block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-xs md:text-sm font-medium truncate leading-tight" title={doctor.email}>
                    {doctor.email}
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BUTTON */}
      <div className="px-3 pb-3 md:px-4 md:pb-4 md:pt-0">
        <button
          onClick={() => navigate(`/patient/book/${doctor.doctor_id}`)}
          className="w-full bg-gradient-to-r from-blue-700 to-[#2dc7f8] text-white font-bold py-2 md:py-3 text-xs md:text-base rounded-lg md:rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 md:gap-2"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;