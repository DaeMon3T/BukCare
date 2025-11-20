// src/pages/doctor/Dashboard.tsx
import { useState, useEffect } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Edit3,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "@/components/Navbar";
import api from "@/utils/api";

// 🩺 Appointment type definition
interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// 📊 Dashboard Statistics
interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
}

const DoctorDashboard: FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    upcomingAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "all">("today");

  // Fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get<Appointment[]>("/appointments/");
      const appointmentsData = response.data;
      setAppointments(appointmentsData);
      
      // Calculate statistics
      calculateStats(appointmentsData);
    } catch (error: any) {
      console.error("Failed to load appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentsData: Appointment[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats: DashboardStats = {
      totalAppointments: appointmentsData.length,
      todayAppointments: appointmentsData.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      }).length,
      upcomingAppointments: appointmentsData.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate > today && apt.status !== "cancelled";
      }).length,
      pendingAppointments: appointmentsData.filter((apt) => apt.status === "pending").length,
      confirmedAppointments: appointmentsData.filter((apt) => apt.status === "confirmed").length,
      completedAppointments: appointmentsData.filter((apt) => apt.status === "completed").length,
      cancelledAppointments: appointmentsData.filter((apt) => apt.status === "cancelled").length,
    };

    setStats(stats);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "cancelled":
        return "text-red-600 bg-red-100 border-red-200";
      case "completed":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const aptDate = new Date(date);
    aptDate.setHours(0, 0, 0, 0);

    if (aptDate.getTime() === today.getTime()) {
      return "Today";
    } else if (aptDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const filterAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (activeTab === "today") {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      });
    } else if (activeTab === "upcoming") {
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= tomorrow && apt.status !== "cancelled";
      });
    } else {
      return appointments;
    }
  };

  const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
    try {
      await api.put(`/appointments/${appointmentId}/status?status=${newStatus}`);
      toast.success(`Appointment ${newStatus}`);
      fetchAppointments(); // Refresh data
      setShowAppointmentDetails(false);
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update appointment status");
    }
  };

  // 📋 Appointment Details Modal
  const AppointmentDetailsModal: FC = () =>
    selectedAppointment ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Appointment Details
            </h2>
            <button
              onClick={() => setShowAppointmentDetails(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Patient Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Patient Information</h3>
              <p className="text-lg font-semibold text-gray-800">{selectedAppointment.patient_name}</p>
              <p className="text-sm text-gray-600">Patient ID: #{selectedAppointment.patient_id}</p>
            </div>

            {/* Appointment Info */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Date</span>
                <span className="font-medium text-gray-800">
                  {formatDate(selectedAppointment.appointment_date)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Time</span>
                <span className="font-medium text-gray-800">
                  {formatTime(selectedAppointment.appointment_date)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {selectedAppointment.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Reason */}
            {selectedAppointment.reason && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Reason for Visit</h3>
                <p className="text-gray-800">{selectedAppointment.reason}</p>
              </div>
            )}

            {/* Notes */}
            {selectedAppointment.notes && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Notes</h3>
                <p className="text-gray-800">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {selectedAppointment.status === "pending" && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, "confirmed")}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedAppointment.id, "cancelled")}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Cancel
                  </button>
                </>
              )}
              {selectedAppointment.status === "confirmed" && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppointment.id, "completed")}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredAppointments = filterAppointments();

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Navbar */}
      <Navbar/>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Good morning, Doctor!</h1>
              <p className="text-green-100">
                You have {stats.todayAppointments} appointment{stats.todayAppointments !== 1 ? 's' : ''} today.
                {stats.pendingAppointments > 0 && ` ${stats.pendingAppointments} pending approval.`}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-800">{stats.todayAppointments}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pendingAppointments}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-gray-800">{stats.confirmedAppointments}</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalAppointments}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/doctor/set-availability')}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Set Availability</h3>
                  <p className="text-sm text-gray-600">Manage your schedule</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/doctor/appointments')}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">View All Appointments</h3>
                  <p className="text-sm text-gray-600">Manage appointments</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/doctor/calendar')}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Calendar View</h3>
                  <p className="text-sm text-gray-600">View schedule calendar</p>
                </div>
              </div>
            </button>
          </div>

          {/* Appointments Dashboard */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
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
                    Today ({stats.todayAppointments})
                  </button>
                  <button
                    onClick={() => setActiveTab("upcoming")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "upcoming"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Upcoming ({stats.upcomingAppointments})
                  </button>
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "all"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="p-4 lg:p-6 space-y-4 max-h-[600px] overflow-y-auto">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No {activeTab} appointments</p>
                    <p className="text-sm mt-1">Your schedule is clear</p>
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800 text-lg">
                              {appointment.patient_name}
                            </h3>
                            <div
                              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(appointment.appointment_date)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatTime(appointment.appointment_date)}
                            </span>
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              <span className="font-medium">Reason:</span> {appointment.reason}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowAppointmentDetails(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {appointment.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(appointment.id, "confirmed")}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Confirm"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="font-semibold text-yellow-600">
                      {stats.pendingAppointments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Confirmed</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {stats.confirmedAppointments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {stats.completedAppointments}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {stats.cancelledAppointments}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Next Appointments</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {appointments
                    .filter((apt) => {
                      const aptDate = new Date(apt.appointment_date);
                      return aptDate > new Date() && apt.status !== "cancelled";
                    })
                    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
                    .slice(0, 5)
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowAppointmentDetails(true);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                              {apt.patient_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(apt.appointment_date)} • {formatTime(apt.appointment_date)}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  {appointments.filter((apt) => {
                    const aptDate = new Date(apt.appointment_date);
                    return aptDate > new Date() && apt.status !== "cancelled";
                  }).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">
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
  );
};

export default DoctorDashboard;