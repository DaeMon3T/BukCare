import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Plus,
  Users,
  UserCog,
  Activity
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
import adminAPI from "@/services/admin/AdminAPI";
import type { DashboardStats, SystemHealth } from "@/services/admin/AdminAPI";
import { useAuth } from "@/context/AuthContext";

// Import Assets
import totalPatientIcon from "@/assets/images/total_users.png";
import patientIcon from "@/assets/images/patient.png";
import doctorIcon from "@/assets/images/doctor.png";
import appointmentIcon from "@/assets/images/appointment.png";
import backendIcon from "@/assets/images/backend.png";
import databaseIcon from "@/assets/images/database.png";

interface NotificationData {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const CHART_COLORS = {
  patients: "#3B82F6", // Blue
  doctors: "#10B981",  // Emerald
  admins: "#8B5CF6",   // Purple
  appointments: "#F59E0B", // Amber
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

  // Dashboard Stats State
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPatients: 0,
    totalDoctors: 0,
    totalAdmins: 0,
    totalAppointments: 0,
    pendingDoctorApprovals: 0,
    activeUsers: 0,
    newUsersThisWeek: 0,
    weeklyGrowth: [],
  });

  const [loading, setLoading] = useState<boolean>(true);

  const showNotification = (type: NotificationData["type"], message: string) => {
    setNotification({ type, message });
  };

  const closeNotification = () => setNotification(null);

  // Fetch Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [healthData, statsData] = await Promise.all([
        adminAPI.getSystemHealth(),
        adminAPI.getDashboardStats(),
      ]);
      setSystemHealth(healthData);
      setStats(statsData);
    } catch (error) {
      console.error(error);
      showNotification("error", "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const userDistributionData = [
    { name: "Patients", value: stats.totalPatients, color: CHART_COLORS.patients },
    { name: "Doctors", value: stats.totalDoctors, color: CHART_COLORS.doctors },
    { name: "Admins", value: stats.totalAdmins, color: CHART_COLORS.admins },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-slate-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    // ✨ BACKGROUND: Slate-100 (Softer than white)
    <div className="min-h-screen bg-slate-100 relative overflow-hidden font-sans text-slate-800 flex flex-col">
      
      {/* 🎨 AMBIENT BLOBS (Opacity Reduced to 10% for less glare) */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-400/10 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full">
        {notification && (
            <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                <Notification
                type={notification.type}
                message={notification.message}
                onClose={closeNotification}
                />
            </div>
        )}

        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Admin Dashboard</h1>
                <p className="text-slate-500 font-medium">System overview and management center</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="px-5 py-2.5 bg-white/60 border border-white/40 rounded-xl text-slate-600 font-bold hover:bg-white transition-all shadow-sm flex items-center gap-2 text-sm backdrop-blur-sm">
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage Users</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
              
              <StatsCard 
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`+${stats.newUsersThisWeek} this week`}
                icon={totalPatientIcon}
                trendIcon={TrendingUp}
                color="bg-blue-500"
              />

              <StatsCard 
                title="Patients"
                value={stats.totalPatients}
                subtitle={`${stats.totalUsers > 0 ? ((stats.totalPatients / stats.totalUsers) * 100).toFixed(1) : 0}% of users`}
                icon={patientIcon}
                color="bg-cyan-500"
              />

              <StatsCard 
                title="Doctors"
                value={stats.totalDoctors}
                subtitle={`${stats.pendingDoctorApprovals} pending approval`}
                icon={doctorIcon}
                color="bg-emerald-500"
              />

              <StatsCard 
                title="Appointments"
                value={stats.totalAppointments}
                subtitle="System-wide total"
                icon={appointmentIcon}
                color="bg-amber-500"
              />

              {/* SYSTEM HEALTH CARD */}
              <div className="bg-white/40 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-sm border border-white/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">System Health</h3>
                    <Activity className="w-5 h-5 text-purple-500" />
                </div>
                
                <div className="space-y-3">
                    <HealthItem 
                        icon={backendIcon} 
                        label="Backend" 
                        status={systemHealth.backend_status} 
                    />
                    <HealthItem 
                        icon={databaseIcon} 
                        label="Database" 
                        status={systemHealth.database_status} 
                    />
                    <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/40">
                        <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Uptime</span>
                        <span className="text-purple-600">{systemHealth.uptime}</span>
                    </div>
                </div>
              </div>

            </div>

            {/* Charts and Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
              
              {/* Left Column - Charts (2/3 width) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Weekly Growth Chart - Reduced Opacity to white/40 */}
                <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/40 p-8 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">User Growth</h3>
                            <p className="text-sm text-slate-500">Weekly registration trends</p>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex gap-4">
                            <LegendItem color="bg-blue-500" label="Patients" />
                            <LegendItem color="bg-emerald-500" label="Doctors" />
                            <LegendItem color="bg-purple-500" label="Admins" />
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {stats.weeklyGrowth && stats.weeklyGrowth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.weeklyGrowth} barSize={20}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                            color: '#1e293b'
                                        }}
                                    />
                                    <Bar dataKey="patients" stackId="a" fill="#3B82F6" radius={[0, 0, 4, 4]} />
                                    <Bar dataKey="doctors" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="admins" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                <p>No growth data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <QuickActionCard 
                        icon={Users} 
                        color="text-blue-600" 
                        bgColor="bg-purple-100" 
                        title="Manage Users" 
                        desc="View all system users" 
                        onClick={() => navigate('/admin/users')}
                    />
                    <QuickActionCard 
                        icon={AlertCircle} 
                        color="text-blue-600" 
                        bgColor="bg-purple-100" 
                        title="Pending Approvals" 
                        desc={`${stats.pendingDoctorApprovals} doctors waiting`} 
                        onClick={() => navigate('/admin/users?filter=doctors&status=pending')}
                    />
                    <QuickActionCard 
                        icon={UserCog} 
                        color="text-blue-600" 
                        bgColor="bg-purple-100" 
                        title="My Profile" 
                        desc="Account settings" 
                        onClick={() => navigate('/admin/profile')}
                    />
                </div>
              </div>

              {/* Right Column - Distribution (1/3 width) */}
              <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/40 p-8 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Distribution</h3>
                    <p className="text-sm text-slate-500">Users by role type</p>
                </div>

                <div className="flex-1 min-h-[300px] relative">
                    {userDistributionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={userDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {userDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        borderRadius: '12px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                                    }} 
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36} 
                                    iconType="circle"
                                    formatter={(value) => <span className="text-slate-600 font-bold ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <p>No distribution data</p>
                        </div>
                    )}
                    
                    {/* Center Text for Donut Chart */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-4xl font-extrabold text-slate-800">{stats.totalUsers}</span>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total</span>
                    </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

// 1. Stats Card (Softer Background: bg-white/40)
const StatsCard = ({ title, value, subtitle, icon, trendIcon: TrendIcon, color }: any) => (
    <div className="bg-white/40 backdrop-blur-xl rounded-[1.5rem] p-5 shadow-sm border border-white/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 ${color}`}></div>
        
        <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center shadow-sm border border-white/50">
                <img src={icon} alt={title} className="w-6 h-6" />
            </div>
            {TrendIcon && (
                <div className="bg-slate-200/50 p-1.5 rounded-full">
                    <TrendIcon className="w-4 h-4 text-slate-600" />
                </div>
            )}
        </div>
        
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mb-1">{value}</h3>
            <p className="text-xs font-medium text-slate-500">{subtitle}</p>
        </div>
    </div>
);

// 2. Health Item
const HealthItem = ({ icon, label, status }: any) => {
    const isHealthy = (status || "").toLowerCase().includes("active") || 
                      (status || "").toLowerCase().includes("connected") || 
                      status === "healthy";
                      
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <img src={icon} alt={label} className="w-4 h-4 opacity-70" />
                <span className="text-sm font-bold text-slate-600">{label}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                isHealthy ? "bg-emerald-100/80 text-emerald-700" : "bg-rose-100/80 text-rose-700"
            }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                {status}
            </div>
        </div>
    );
};

// 3. Quick Action Card (Softer Background)
const QuickActionCard = ({ icon: Icon, color, bgColor, title, desc, onClick }: any) => (
    <button 
        onClick={onClick}
        className="bg-white/40 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-sm border border-white/40 text-left hover:shadow-md hover:bg-white/60 transition-all group"
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
                <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
            </div>
        </div>
    </button>
);

// 4. Legend Item
const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-1.5">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-xs font-bold text-slate-500">{label}</span>
    </div>
);

export default AdminDashboard;