import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaCalendarCheck, FaFileMedical, FaBell } from "react-icons/fa";

const PatientInterface: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <Navbar/>

      {/* Main content */}
      <main className="flex-grow h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              <FaCalendarCheck className="text-blue-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
              <p className="text-gray-500">View your upcoming appointments and manage bookings.</p>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              <FaFileMedical className="text-purple-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Health Records</h2>
              <p className="text-gray-500">Check your medical history, test results, and lab reports.</p>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              <FaBell className="text-yellow-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
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
