import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";
import type { Doctor as APIDoctor } from "@/services/patient/GetDoctorAPI";
import BookingModal from "@/components/BookingModal";
import type { Doctor } from "@/components/DoctorCard";

interface UICardDoctor {
  doctor_id: number;
  name: string;
  specialization?: { name?: string };
  avatar: string;
  address: string;
  email: string;
  is_doctor_approved?: boolean;
}

const FindDoctor: React.FC = () => {
  const [allDoctors, setAllDoctors] = useState<UICardDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data: APIDoctor[] = await GetDoctorAPI.getDoctors();

        const formattedDoctors: UICardDoctor[] = data.map((doc) => ({
          doctor_id: doc.doctor_id,
          name: doc.name,
          specialization: { name: doc.specialization || "General Practice" },
          avatar: (doc as any).avatar || "/default-avatar.png",
          address: doc.address || "Not provided",
          email: doc.email || "No email",
          is_doctor_approved: (doc as any).is_doctor_approved ?? false,
        }));

        setAllDoctors(formattedDoctors);
      } catch (err) {
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = allDoctors.filter((doc) => {
    const query = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(query) ||
      doc.specialization?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Find a Doctor</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((doc) => (
              <DoctorCard key={doc.doctor_id} doctor={doc} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No doctors found</p>
        )}
      </main>
    </div>
  );
};

export default FindDoctor;
