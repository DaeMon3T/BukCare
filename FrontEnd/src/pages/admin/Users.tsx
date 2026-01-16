import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Stethoscope,
  User as UserIcon,
  ShieldCheck
} from "lucide-react";
import usersAPI from "@/services/admin/Users";
import { useNavigate } from "react-router-dom";

// --- TYPES ---
interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  contact_number?: string;
  role: "admin" | "patient" | "doctor" | "pending";
  sex?: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_profile_complete: boolean;
  picture?: string;
  created_at: string;
  last_login?: string;
}

interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  total_staff: number;
  pending_approvals: number;
  active_sessions: number;
  pending_invites: number;
}

const Users: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_patients: 0,
    total_doctors: 0,
    total_staff: 0,
    pending_approvals: 0,
    active_sessions: 0,
    pending_invites: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "doctor" | "pending">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // --- API FETCH ---
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const apiUsers = await usersAPI.getAllUsers();

        const formattedUsers: User[] = apiUsers.map((u: any) => ({
          id: u.id,
          fname: u.fname,
          mname: u.mname,
          lname: u.lname,
          email: u.email,
          contact_number: u.contact_number,
          role: u.role as User["role"],
          sex: u.sex,
          is_active: u.is_active,
          is_verified: u.is_verified,
          is_profile_complete: u.is_profile_complete,
          picture: u.picture || null, // Allow null for fallback handling
          created_at: u.created_at,
          last_login: u.last_login,
        }));

        setUsers(formattedUsers);

        // Calculate stats
        setStats({
          total_patients: formattedUsers.filter((u) => u.role === "patient").length,
          total_doctors: formattedUsers.filter((u) => u.role === "doctor").length,
          total_staff: formattedUsers.filter((u) => u.role === "admin").length,
          pending_approvals: formattedUsers.filter((u) => u.role === "pending").length,
          active_sessions: formattedUsers.filter((u) => u.is_active).length,
          pending_invites: 0,
        });
      } catch (error) {
        console.error("Failed to fetch API users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // --- FILTERING LOGIC ---
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== "all") filtered = filtered.filter((user) => user.role === roleFilter);
    if (statusFilter !== "all")
      filtered = filtered.filter((user) => (statusFilter === "active" ? user.is_active : !user.is_active));
    if (searchQuery)
      filtered = filtered.filter(
        (user) =>
          user.fname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.contact_number && user.contact_number.includes(searchQuery))
      );

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  // --- ACTIONS ---
  const handleAction = (action: string, user: User) => {
    if (action === "view") {
      navigate(`/admin/users/${user.id}`);
    } else if (action === "delete") {
      alert(`Delete user ID: ${user.id} (UI Demo - No API call)`);
    }
    setActiveDropdown(null);
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Email", "Phone", "Role", "Status", "Verified", "Profile Complete", "Join Date"],
      ...filteredUsers.map((user) => [
        user.id,
        `${user.fname} ${user.lname}`,
        user.email,
        user.contact_number || "N/A",
        user.role,
        user.is_active ? "Active" : "Inactive",
        user.is_verified ? "Yes" : "No",
        user.is_profile_complete ? "Yes" : "No",
        new Date(user.created_at).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // --- HELPER: BADGE COLORS ---
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "patient":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const totalUsers = stats.total_patients + stats.total_doctors + stats.total_staff;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans text-slate-800 flex flex-col">
      
      {/* 🎨 Ambient Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full">
        <Navbar/>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">User Management</h1>
              <p className="text-slate-500">View, manage, and approve users in the BukCare system.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                label="Total Users" 
                value={totalUsers} 
                icon={UsersIcon} 
                color="bg-blue-500" 
                subColor="bg-blue-50 text-blue-600" 
              />
              <StatsCard 
                label="Patients" 
                value={stats.total_patients} 
                icon={UserIcon} 
                color="bg-emerald-500" 
                subColor="bg-emerald-50 text-emerald-600" 
              />
              <StatsCard 
                label="Doctors" 
                value={stats.total_doctors} 
                icon={Stethoscope} 
                color="bg-purple-500" 
                subColor="bg-purple-50 text-purple-600" 
              />
              <StatsCard 
                label="Pending Approvals" 
                value={stats.pending_approvals} 
                icon={Clock} 
                color="bg-amber-500" 
                subColor="bg-amber-50 text-amber-600" 
              />
            </div>

            {/* Filters Bar */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center">
              
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all placeholder-slate-400"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative group">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as any)}
                        className="pl-9 pr-8 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] outline-none appearance-none text-slate-700 font-medium cursor-pointer hover:bg-white transition-all w-full"
                    >
                        <option value="all">All Roles</option>
                        <option value="patient">Patients</option>
                        <option value="doctor">Doctors</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] outline-none appearance-none text-slate-700 font-medium cursor-pointer hover:bg-white transition-all w-full"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <button
                    onClick={handleExport}
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-[#00aeef] transition-all flex items-center gap-2 font-bold shadow-lg shadow-blue-900/10 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-lg shadow-slate-200/50 border border-white/60 overflow-hidden">
              {loading ? (
                <div className="p-20 text-center">
                  <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-[#00aeef] rounded-full animate-spin"></div>
                  <p className="mt-4 text-slate-500 font-medium">Loading user database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UsersIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No users found</h3>
                  <p className="text-slate-500">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200/60 text-left">
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">User Profile</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                          
                          {/* User Profile */}
                          <td className="px-8 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-white mr-4 bg-slate-200">
                                <img
                                  src={user.picture || `https://ui-avatars.com/api/?name=${user.fname}+${user.lname}&background=random`}
                                  alt={`${user.fname}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.fname}+${user.lname}&background=random`; }}
                                />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-base">
                                  {user.fname} {user.mname} {user.lname}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {user.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                    <span className="text-xs text-slate-400">ID: #{user.id}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <Mail className="w-3.5 h-3.5 text-blue-400" /> {user.email}
                              </div>
                              {user.contact_number && (
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.contact_number}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wide ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${user.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></div>
                                    <span className={`text-xs font-bold ${user.is_active ? "text-slate-700" : "text-slate-400"}`}>
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {user.is_profile_complete 
                                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 
                                        : <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                    }
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Profile</span>
                                </div>
                            </div>
                          </td>

                          {/* Join Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-600">
                                {new Date(user.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-400">
                                {new Date(user.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === user.id ? null : user.id); }}
                              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-[#00aeef]"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdown === user.id && (
                              <div className="absolute right-8 top-8 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Manage User</p>
                                </div>
                                <button
                                  onClick={() => handleAction("view", user)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                >
                                  <Eye className="w-4 h-4" /> View Details
                                </button>
                                <button
                                  onClick={() => handleAction("delete", user)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete User
                                </button>
                              </div>
                            )}
                            
                            {/* Backdrop to close dropdown */}
                            {activeDropdown === user.id && (
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 text-sm font-medium text-slate-400 text-center">
              Showing {filteredUsers.length} of {users.length} users
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

// --- SUB COMPONENT: Stats Card ---
const StatsCard = ({ label, value, icon: Icon, color, subColor }: any) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-xl rounded-[1.5rem] p-6 shadow-sm border border-white/60 relative overflow-hidden group"
    >
        <div className="flex justify-between items-start relative z-10">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${subColor}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:scale-150 transition-transform duration-500 ${color}`}></div>
    </motion.div>
);

export default Users;