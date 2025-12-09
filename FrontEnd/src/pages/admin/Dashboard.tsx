import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Plus,
  Users,
  UserCog,
  Shield,

} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import Navbar from "@/components/Navbar";
import Notification from "@/components/Notification";
// FIXED: Separated the default import (value) from named imports (types)
import adminAPI from "@/services/admin/AdminAPI";
import type { DashboardStats, SystemHealth } from "@/services/admin/AdminAPI";
import { useAuth } from "@/context/AuthContext";

// Import Assets
import totalPatientIcon from "@/assets/total_users.png";
import patientIcon from "@/assets/patient.png";
import doctorIcon from "@/assets/doctor.png";
import appointmentIcon from "@/assets/appointment.png";
import backendIcon from "@/assets/backend.png";
import databaseIcon from "@/assets/database.png";

interface NotificationData {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const CHART_COLORS = {
  patients: "#3B82F6",
  doctors: "#10B981",
  admins: "#8B5CF6",
  appointments: "#F59E0B",
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();

  const [notification, setNotification] = useState<NotificationData | null>(null);
  
  // System Health State
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    backend_status: "Checking...",
    database_status: "Checking...",
    uptime: "0s",
  });

  // Dashboard Stats State (Dynamic)
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAdmins: 0,
    totalAppointments: 0,
    pendingDoctorApprovals: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    weeklyGrowth: [], // Data for Bar Chart
  });

  const [loading, setLoading] = useState<boolean>(true);

  const showNotification = (type: NotificationData["type"], message: string) => {
    setNotification({ type, message });
  };

  const closeNotification = () => setNotification(null);

  // Fetch Real Data from API
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch both Health and Stats in parallel
      const [healthData, statsData] = await Promise.all([
        adminAPI.getSystemHealth(),
        adminAPI.getDashboardStats(),
      ]);

      setSystemHealth(healthData);
      setStats(statsData);
      
    } catch (error) {
      console.error(error);
      showNotification("error", "Failed to load dashboard data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Prepare Pie Chart Data dynamically based on stats
  const userDistributionData = [
    { name: "Patients", value: stats.totalPatients, color: CHART_COLORS.patients },
    { name: "Doctors", value: stats.totalDoctors, color: CHART_COLORS.doctors },
    { name: "Admins", value: stats.totalAdmins, color: CHART_COLORS.admins },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <Navbar />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-2">System overview and management center</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <button 
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Manage Users</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
          {/* TOTAL USERS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 backdrop-blur-lg border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                  <img src={totalPatientIcon} alt="Total Users" className="w-8 h-8" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">Total Users</p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500 font-medium">+{stats.newUsersThisWeek} this week</p>
            </div>
          </div>

          {/* TOTAL PATIENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 backdrop-blur-lg border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                  <img src={patientIcon} alt="Total Users" className="w-8 h-8" />
                </div>
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg"></div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">Patients</p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">{stats.totalPatients}</p>
              <p className="text-xs text-slate-500 font-medium">
                {stats.totalUsers > 0 ? ((stats.totalPatients / stats.totalUsers) * 100).toFixed(1) : 0}% of users
              </p>
            </div>
          </div>

          {/* TOTAL DOCTORS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/20 to-transparent transition duration-500 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 backdrop-blur-lg border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                  <img src={doctorIcon} alt="Total Users" className="w-8 h-8" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <CheckCircle className="w-5 h-5 text-slate-700" />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">Doctors</p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">{stats.totalDoctors}</p>
              <p className="text-xs text-slate-500 font-medium">{stats.pendingDoctorApprovals} pending approval</p>
            </div>
          </div>

          {/* TOTAL APPOINTMENTS */}
          <div className="relative bg-white/40 backdrop-blur-2xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 backdrop-blur-lg border border-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                  <img src={appointmentIcon} alt="Appointment Icon" className="w-8 h-8" />
                </div>
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <span className="text-xs font-bold text-slate-700">All</span>
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-bold text-slate-600/90 mb-2">Appointments</p>
              <p className="text-5xl font-bold text-slate-900 leading-tight mb-3">{stats.totalAppointments}</p>
              <p className="text-xs text-slate-500 font-medium">System-wide total</p>
            </div>
          </div>

          {/* SYSTEM HEALTH */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              System Health
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <img src={backendIcon} alt="Backend Icon" className="w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">Backend</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  (systemHealth.backend_status || "").toLowerCase().includes("active") || systemHealth.backend_status === "healthy"
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {systemHealth.backend_status}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <img src={databaseIcon} alt="Database Icon" className="w-4 h-4" />
                  <span className="text-sm font-medium text-slate-700">Database</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                   (systemHealth.database_status || "").toLowerCase().includes("connected") || systemHealth.database_status === "healthy"
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {systemHealth.database_status}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-700">Uptime</span>
                </div>
                <span className="text-xs font-bold text-purple-600">
                  {systemHealth.uptime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <div className="xl:col-span-2 space-y-8">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly User Growth Chart */}
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">User Growth</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Weekly registration trends</p>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-blue-500"></span>
                      <span className="text-slate-700 font-medium">Patients</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-emerald-500"></span>
                      <span className="text-slate-700 font-medium">Doctors</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="w-3 h-3 rounded bg-purple-500"></span>
                      <span className="text-slate-700 font-medium">Admins</span>
                    </div>
                  </div>

                  {stats.weeklyGrowth && stats.weeklyGrowth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.weeklyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b" 
                          fontSize={12}
                          tick={{ fill: '#64748b' }}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={12}
                          tick={{ fill: '#64748b' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            padding: '12px'
                          }}
                        />
                        <Bar dataKey="patients" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="doctors" fill="#10B981" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="admins" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-slate-400">
                      <p>No growth data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Distribution Chart */}
              <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl shadow-lg border border-slate-200/60 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">User Distribution</h3>
                      <p className="text-xs text-slate-500 mt-0.5">By user type</p>
                    </div>
                  </div>

                  {userDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={userDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {userDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-slate-400">
                      <p>No distribution data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-purple-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <Users className="w-7 h-7 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Manage Users</h3>
                    <p className="text-sm text-slate-600 mt-1">View all users</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/users?filter=doctors&status=pending')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <AlertCircle className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Pending Approvals</h3>
                    <p className="text-sm text-slate-600 mt-1">{stats.pendingDoctorApprovals} doctors</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate('/admin/profile')}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all duration-300 group text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <UserCog className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">My Profile</h3>
                    <p className="text-sm text-slate-600 mt-1">Account settings</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboard;