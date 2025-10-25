import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";
import type { Doctor as APIDoctor } from "@/services/patient/GetDoctorAPI";

interface UICardDoctor {
  doctor_id: number;
  name: string;
  specialization?: {
    name?: string;
    descriptions?: string;
  };
  avatar: string;
  address: string;
  email: string;
}

const FindDoctor: React.FC = () => {
  const [doctors, setDoctors] = useState<UICardDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState<UICardDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data: APIDoctor[] = await GetDoctorAPI.getDoctors();

        const formattedDoctors: UICardDoctor[] = data.map((doc) => ({
          doctor_id: doc.doctor_id,
          name: doc.name,
          specialization: { name: doc.specialization },
          avatar: "/default-avatar.png",
          address: doc.address || "Not provided",
          email: doc.email || "No email available",
        }));

        setDoctors(formattedDoctors);
        setFilteredDoctors(formattedDoctors);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // ✅ Filter doctors when search changes
  useEffect(() => {
    if (search.trim() === "") {
      setFilteredDoctors(doctors);
    } else {
      const query = search.toLowerCase();
      setFilteredDoctors(
        doctors.filter(
          (doc) =>
            doc.name.toLowerCase().includes(query) ||
            doc.specialization?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [search, doctors]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar role="patient" />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Find a Doctor
          </h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Doctor List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading doctors...</p>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <DoctorCard key={doc.doctor_id} doctor={doc} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No doctors found for “{search}”.
          </p>
        )}
      </main>
    </div>
  );
};

export default FindDoctor;
