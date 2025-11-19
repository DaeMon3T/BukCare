
// src/pages/doctor/Dashboard.tsx
import { useState } from "react";
import type { FC, JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Edit3,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";

// 🩺 Appointment type definition
interface Appointment {
  id: number;
  patientName: string;
  date: string; // e.g., 'Today' or '2025-10-12'
  time: string;
  duration: string;
  type: string;
  reason: string;
  status: "confirmed" | "pending" | "cancelled" | string;
}

// 🧠 User type definition
interface User {
  name: string;
  email: string;
}

// ✅ Props for DoctorInterface
interface DoctorInterfaceProps {
  user?: User;
  appointments?: Appointment[];
}

const DoctorInterface: FC<DoctorInterfaceProps> = ({
  user = { name: "Doctor", email: "doctor@clinic.com" },
  appointments = [],
}) => {
  const navigate = useNavigate();
  const [showAppointmentDetails, setShowAppointmentDetails] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // 📋 Appointment Details Modal
  const AppointmentDetailsModal: FC = () =>
    selectedAppointment ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Appointment Details
          </h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
            <p><strong>Date:</strong> {selectedAppointment.date}</p>
            <p><strong>Time:</strong> {selectedAppointment.time}</p>
            <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
            <p><strong>Status:</strong> {selectedAppointment.status}</p>
          </div>
          <div className="mt-6 text-right">
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      
      {/* 🎥 VIDEO BACKGROUND SETUP */}
      {/* Ensure 'Bukcare-video-bg.mp4' is in your 'public' folder */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/Bukcare-video-bg.mp4" type="video/mp4" />
        
      </video>

      {/* 🌫️ OVERLAY */}
      {/* This adds a semi-transparent white layer so the text is readable over the video */}
      <div className="absolute inset-0 bg-white/30 z-0"></div>
      {/* BRAND OVERLAY: Changed from white to Deep Navy Blue (#002B5B) 
            High opacity (90%) ensures text legibility while keeping the video as a subtle animated texture. */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#002B5B]/80 mix-blend-multiply"></div>

      {/* 📦 CONTENT WRAPPER */}
      {/* z-10 ensures the content sits ON TOP of the video and overlay */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Navbar */}
        <Navbar role="doctor" />

        {/* Main Content */}
        <main className="h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            {/* Welcome Section */}
            <div className="mb-6">
              <div className="rounded-2xl p-6 text-[#F5CC00]">
                <h1 className="text-2xl font-bold mb-2">Good morning, {user.name}!</h1>
                <p className="text-green-100">
                  You have {appointments.filter((apt) => apt.date === "Today").length} appointments
                  today. Manage your schedule and availability.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => navigate('/doctor/set-availability')}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="flex items-center space-x-4 ">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center ">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Set Availability</h3>
                    <p className="text-sm text-gray-600">Manage your schedule</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md cursor-pointer hover:scale-105 transition-transform duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Total Patients</h3>
                    <p className="text-2xl font-bold text-gray-800">{appointments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments Dashboard */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Appointments</h2>
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab("today")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "today"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setActiveTab("upcoming")}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "upcoming"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Upcoming
                    </button>
                  </div>
                </div>

                <div className="p-4 lg:p-6 space-y-4">
                  {appointments.filter((apt) =>
                    activeTab === "today" ? apt.date === "Today" : apt.date !== "Today"
                  ).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No {activeTab} appointments</p>
                    </div>
                  ) : (
                    appointments
                      .filter((apt) =>
                        activeTab === "today" ? apt.date === "Today" : apt.date !== "Today"
                      )
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors flex justify-between items-center bg-white"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-800">
                                {appointment.patientName}
                              </h3>
                              <div
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  appointment.status
                                )}`}
                              >
                                {getStatusIcon(appointment.status)}
                                <span className="capitalize">{appointment.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {appointment.time} ({appointment.duration})
                              </span>
                              <span>{appointment.type}</span>
                            </div>
                            <p className="text-sm text-gray-600">{appointment.reason}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAppointmentDetails(true);
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Today's Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Appointments</span>
                      <span className="font-semibold text-gray-800">
                        {appointments.filter((apt) => apt.date === "Today").length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confirmed</span>
                      <span className="font-semibold text-green-600">
                        {appointments.filter(
                          (apt) => apt.date === "Today" && apt.status === "confirmed"
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        {appointments.filter(
                          (apt) => apt.date === "Today" && apt.status === "pending"
                        ).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cancelled</span>
                      <span className="font-semibold text-red-600">
                        {appointments.filter(
                          (apt) => apt.date === "Today" && apt.status === "cancelled"
                        ).length}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Upcoming Appointments</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {appointments.filter((apt) => apt.date !== "Today").map((apt) => (
                      <div
                        key={apt.id}
                        className="p-2 rounded-lg hover:bg-gray-50 flex justify-between items-center"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {apt.patientName}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {apt.date}
                        </span>
                      </div>
                    ))}
                    {appointments.filter((apt) => apt.date !== "Today").length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming appointments
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Modal */}
        {showAppointmentDetails && <AppointmentDetailsModal />}
      </div>
    </div>
  );
};

export default DoctorInterface;