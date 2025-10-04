import React from "react";
import Navbar from "../../components/Navbar";
import DoctorCard from "../../components/DoctorCard";

const PatientInterface = () => {
  // 🧪 Mock data (replace with real data later)
  const doctors = [
    {
      doctor_id: 1,
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@healthcare.com",
      specialization: {
        name: "Cardiology",
        descriptions: "Expert in heart health, cardiovascular treatments, and cardiac surgery."
      },
      address: "City Medical Center, New York, NY",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg"
    },
    {
      doctor_id: 2,
      name: "Dr. James Lee",
      email: "james.lee@healthcare.com",
      specialization: {
        name: "Dermatology",
        descriptions: "Specialist in skin care, acne treatment, and aesthetic dermatology."
      },
      address: "Health First Clinic, Los Angeles, CA",
      avatar: "https://randomuser.me/api/portraits/men/46.jpg"
    },
    {
      doctor_id: 3,
      name: "Dr. Aisha Ahmed",
      email: "aisha.ahmed@healthcare.com",
      specialization: {
        name: "Pediatrics",
        descriptions: "Caring for infants, children, and adolescents with compassion and expertise."
      },
      address: "Sunrise Hospital, Chicago, IL",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg"
    }
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Navbar */}
      <Navbar role="patient" />

      {/* Main Content */}
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

          {/* Quick Action */}
          <div className="mb-6">
            <div className="max-w-2xl mx-auto lg:max-w-none">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-center lg:justify-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-center lg:text-left">
                    <h3 className="font-semibold text-gray-800">
                      Book Appointment
                    </h3>
                    <p className="text-sm text-gray-600">
                      Schedule with doctors quickly and easily
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 👨‍⚕️ Doctors Section */}
          <div className="mb-6">
            <h2 className="text-lg lg:text-2xl font-bold text-gray-800 mb-6">
              Meet Our Specialists
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {doctors.map((doc) => (
                <DoctorCard key={doc.doctor_id} doctor={doc} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientInterface;
