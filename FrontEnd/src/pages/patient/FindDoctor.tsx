import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import DoctorCard from "@/components/DoctorCard";
import GetDoctorAPI from "@/services/patient/GetDoctorAPI";
import type { Doctor as APIDoctor } from "@/services/patient/GetDoctorAPI";
import BookingModal from "@/components/BookingModal";
import type { Doctor } from "@/components/DoctorCard";
import api from "@/utils/api";

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
  is_doctor_approved?: boolean;
}

const FindDoctor: React.FC = () => {
  const [allDoctors, setAllDoctors] = useState<UICardDoctor[]>([]);
  const [approvedDoctors, setApprovedDoctors] = useState<UICardDoctor[]>([]);
  const [unapprovedDoctors, setUnapprovedDoctors] = useState<UICardDoctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // ✅ Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data: APIDoctor[] = await GetDoctorAPI.getDoctors();

        const formattedDoctors: UICardDoctor[] = data.map((doc) => ({
          doctor_id: doc.doctor_id,
          name: doc.name,
          specialization: { name: doc.specialization || "General Practice" },  // ✅ Provide default
          avatar: "/default-avatar.png",
          address: doc.address || "Not provided",
          email: doc.email || "No email available",
          is_doctor_approved: (doc as any).is_doctor_approved ?? false,
        }));

        const approved = formattedDoctors.filter((d) => d.is_doctor_approved);
        const unapproved = formattedDoctors.filter((d) => !d.is_doctor_approved);

        setAllDoctors(formattedDoctors);
        setApprovedDoctors(approved);
        setUnapprovedDoctors(unapproved);
      } catch (err) {
        console.error("❌ Failed to fetch doctors:", err);
        toast.error("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // ✅ Handle Book Appointment
  const handleBookClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setIsModalOpen(false);
  };

  // ✅ Confirm Booking → Send to backend
  const handleConfirmBooking = async (details: {
    date: string;
    time: string;
    reason: string;
  }) => {
    if (!selectedDoctor) {
      toast.error("No doctor selected");
      return;
    }

    try {
      setSubmittingBooking(true);

      const appointmentDate = new Date(`${details.date}T${details.time}:00`).toISOString();

      const payload = {
        doctor_id: selectedDoctor.doctor_id,
        appointment_date: appointmentDate,
        reason: details.reason,
        notes: "",
      };

      const res = await api.post("/appointments/", payload);

      if (res.status === 200 || res.status === 201) {
        toast.success("✅ Appointment booked successfully!");
        closeModal();
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err: any) {
      console.error("❌ Booking failed:", err?.response?.data || err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to create appointment";
      toast.error(msg);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // ✅ Search Filter
  const filterBySearch = (list: UICardDoctor[]) => {
    if (search.trim() === "") return list;
    const query = search.toLowerCase();
    return list.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialization?.name?.toLowerCase().includes(query)
    );
  };

  const filteredApproved = filterBySearch(approvedDoctors);
  const filteredUnapproved = filterBySearch(unapprovedDoctors);
  const filteredAll = filterBySearch(allDoctors);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar /> {/* ✅ Fixed: removed role prop */}

      <main className="h-[calc(100vh-4rem)] overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 🔍 Search Bar */}
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading doctors...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ✅ Approved Doctors */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-green-600 text-center">
                ✅ Approved Doctors
              </h2>
              {filteredApproved.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredApproved.map((doc) => (
                    <DoctorCard
                      key={doc.doctor_id}
                      doctor={doc}
                      onBook={() => handleBookClick(doc as Doctor)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No approved doctors found.</p>
              )}
            </section>

            {/* ⚠️ Not Approved */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold mb-4 text-yellow-600 text-center">
                ⚠️ Not Yet Approved
              </h2>
              {filteredUnapproved.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredUnapproved.map((doc) => (
                    <DoctorCard
                      key={doc.doctor_id}
                      doctor={doc}
                      onBook={() => handleBookClick(doc as Doctor)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No pending doctors found.
                </p>
              )}
            </section>

            {/* 🩺 All Doctors */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-blue-600 text-center">
                🩺 All Doctors
              </h2>
              {filteredAll.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredAll.map((doc) => (
                    <DoctorCard
                      key={doc.doctor_id}
                      doctor={doc}
                      onBook={() => handleBookClick(doc as Doctor)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  No doctors found for "{search}".
                </p>
              )}
            </section>
          </>
        )}
      </main>

      {/* 🧾 Booking Modal */}
      {selectedDoctor && (
        <BookingModal
          doctor={selectedDoctor}
          isOpen={isModalOpen}
          onClose={closeModal}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
};

export default FindDoctor;