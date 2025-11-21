import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FaCalendarCheck, FaFileMedical, FaBell } from "react-icons/fa";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const PatientInterface: React.FC = () => {
  const [date, setDate] = useState(new Date());

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Greeting */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Good Morning, [User Name]
            </h1>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              <FaCalendarCheck className="text-blue-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Appointments</h2>
              <p className="text-gray-500">View your upcoming appointments</p>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              <FaBell className="text-yellow-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
              <p className="text-gray-500">See alerts and important updates</p>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col items-start space-y-4">
              {/* You can replace this icon with something else if desired */}
              <FaCalendarCheck className="text-green-500 text-3xl" />
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-gray-500">Your latest actions will appear here</p>
            </div>
          </div>
        </div>

        {/* Floating Calendar */}
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-xl p-4 w-80 z-50">
          <Calendar
            onChange={setDate}
            value={date}
            className="react-calendar border-none text-gray-800"
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PatientInterface;
