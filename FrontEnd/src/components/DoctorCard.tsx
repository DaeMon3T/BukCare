import React from "react";
import { useNavigate } from "react-router-dom";

interface Specialization {
  name?: string;
  descriptions?: string;
}

export interface Doctor {
  doctor_id: number;
  avatar?: string; // optional
  name: string;
  specialization?: Specialization;
  address: string;
  email: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  onBook?: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const navigate = useNavigate();

  // fallback avatar
  const avatarSrc = doctor.avatar && doctor.avatar.trim() !== "" ? doctor.avatar : "/default-avatar.png";

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-blue-100 to-purple-100">
        <img
          src={avatarSrc}
          alt={doctor.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/default-avatar.png";
          }}
        />
        <h3 className="text-xl font-semibold text-gray-800">{doctor.name}</h3>
        <p className="text-sm text-blue-600 font-medium">
          {doctor.specialization?.name || "General Practice"}
        </p>
      </div>

      <div className="p-6 space-y-3">
        <div>
          <p className="text-sm text-gray-500">📍 Address</p>
          <p className="text-gray-800 font-medium">{doctor.address}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">📧 Email</p>
          <p className="text-gray-800 font-medium">{doctor.email}</p>
        </div>

        <button
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition"
          onClick={() => navigate(`/patient/book/${doctor.doctor_id}`)}
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
