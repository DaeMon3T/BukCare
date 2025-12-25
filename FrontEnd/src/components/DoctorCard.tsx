import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Mail, Stethoscope } from "lucide-react";

interface Specialization {
  name?: string;
  descriptions?: string;
}

export interface Doctor {
  doctor_id: number;
  avatar?: string;
  name: string;
  specializations?: Specialization;
  address: string;
  email: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onBook?: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const navigate = useNavigate();

  // Fallback avatar if none provided
  const avatarSrc = doctor.avatar && doctor.avatar.trim() !== "" 
    ? doctor.avatar 
    : "/default-avatar.png";

  return (
    <div className="group relative bg-white rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-slate-100 flex flex-col h-full">
      
      {/* 1. ID CARD HEADER (Gradient & Brand) */}
      <div className="relative h-32 bg-gradient-to-r from-blue-700 to-[#2dc7f8] flex justify-center items-start pt-6">
        {/* Background Pattern/Watermark (Optional) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 text-white/90 z-10">
            <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="font-bold text-sm tracking-wide">BukCare</span>
                <span className="text-[10px] opacity-80 uppercase tracking-wider">Doctor</span>
            </div>
        </div>
      </div>

      {/* 2. AVATAR (Overlapping) */}
      <div className="relative flex justify-center -mt-16 z-20">
        <div className="p-1.5 bg-white rounded-full shadow-md">
            <img
            src={avatarSrc}
            alt={doctor.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-teal-50 bg-slate-100"
            onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
            }}
            />
        </div>
      </div>

      {/* 3. DOCTOR DETAILS */}
      <div className="flex-1 px-6 pt-4 pb-6 text-center flex flex-col">
        {/* Name & Title */}
        <h3 className="text-xl font-bold text-slate-800 mb-1">{doctor.name}</h3>
        <p className="text-blue-600 font-medium text-sm bg-teal-50 inline-block px-3 py-1 rounded-full mx-auto mb-6">
          {doctor.specializations?.name || "General Practice"}
        </p>

        {/* Info Rows */}
        <div className="space-y-4 text-left mt-auto">
          <div className="flex items-start gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Address</p>
                <p className="text-sm font-medium leading-tight">{doctor.address || "Not Provided"}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-600 group-hover:text-slate-800 transition-colors">
            <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm font-medium truncate leading-tight" title={doctor.email}>{doctor.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOOTER BUTTON */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => navigate(`/patient/book/${doctor.doctor_id}`)}
          className="w-full bg-gradient-to-r from-blue-700 to-[#2dc7f8] text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;