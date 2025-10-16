import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PatientInterface: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <Navbar role="patient" />

      {/* Main content */}
      <main className="flex-grow h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Hero Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
              <p className="text-blue-100">
                Here's your health dashboard. Use the navigation to book appointments, view your schedule, and manage your profile.
              </p>
            </div>
          </div>

          {/* Optional dashboard cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Appointments</h2>
              <p className="text-gray-500">View your upcoming appointments and manage bookings.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Health Records</h2>
              <p className="text-gray-500">Check your medical history and test results.</p>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow hover:shadow-md transition">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Notifications</h2>
              <p className="text-gray-500">See alerts, reminders, and important updates.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PatientInterface;
