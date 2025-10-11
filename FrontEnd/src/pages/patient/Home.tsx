// src/pages/patient/PatientInterface.tsx
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";

// ✅ Define doctor type for strong typing
interface Doctor {
  doctor_id: number;
  name: string;
  specialization: string;
  experience?: string;
  [key: string]: any; // optional, for other dynamic fields
}

const PatientInterface: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data: Doctor[] = await GetDoctorAPI.getDoctors();
        setDoctors(data);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };

    fetchDoctors();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar role="patient" />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
              <p className="text-blue-100">
                Here's your health dashboard. Browse and book appointments with our top specialists.
              </p>
            </div>
          </div>

          {/* 👨‍⚕️ Doctors Section */}
          <div className="mb-6">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-800 mb-6">
              Meet Our Specialists
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.length > 0 ? (
                doctors.map((doc) => (
                  <DoctorCard key={doc.doctor_id} doctor={doc} />
                ))
              ) : (
                <p className="text-gray-500">No doctors available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientInterface;
