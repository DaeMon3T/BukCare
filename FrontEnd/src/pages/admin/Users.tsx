import React, { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Search,
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
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import usersAPI from "@/services/admin/Users";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// --- TYPES ---
interface StaffProfile {
  staff_id?: number;
  job_title?: string;
  is_staff_approved?: boolean;
}

interface DoctorProfile {
  doctor_id?: number;
  is_doctor_approved?: boolean;
  license_number?: string;
}

interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  contact_number?: string;
  role: "admin" | "patient" | "doctor" | "staff" | "pending";
  sex?: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_profile_complete: boolean;
  picture?: string;
  created_at: string;
  last_login?: string;
  doctor_profile?: DoctorProfile | null;
  staff_profile?: StaffProfile | null;
}

type TabKey = "all" | "pending_doctors" | "pending_staff" | "doctors" | "staff" | "patients";

const TABS: { key: TabKey; label: string; icon: any; color: string }[] = [
  { key: "all", label: "All Users", icon: UsersIcon, color: "blue" },
  { key: "pending_doctors", label: "Pending Doctors", icon: Clock, color: "amber" },
  { key: "pending_staff", label: "Pending Staff", icon: Clock, color: "orange" },
  { key: "doctors", label: "Doctors", icon: Stethoscope, color: "purple" },
  { key: "staff", label: "Staff", icon: Briefcase, color: "teal" },
  { key: "patients", label: "Patients", icon: UserIcon, color: "emerald" },
];

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const navigate = useNavigate();

  // --- FETCH ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const apiUsers = await usersAPI.getAllUsers();
      setUsers(
        apiUsers.map((u: any) => ({
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
          picture: u.picture || null,
          created_at: u.created_at,
          last_login: u.last_login,
          doctor_profile: u.doctor_profile || null,
          staff_profile: u.staff_profile || null,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // --- FILTERING + SORTING ---
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Tab filter
    switch (activeTab) {
      case "pending_doctors":
        filtered = filtered.filter((u) => u.role === "pending" && !u.staff_profile);
        break;
      case "pending_staff":
        filtered = filtered.filter((u) => u.role === "pending" && !!u.staff_profile);
        break;
      case "doctors":
        filtered = filtered.filter((u) => u.role === "doctor");
        break;
      case "staff":
        filtered = filtered.filter((u) => u.role === "staff");
        break;
      case "patients":
        filtered = filtered.filter((u) => u.role === "patient");
        break;
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.fname.toLowerCase().includes(q) ||
          u.lname.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.contact_number && u.contact_number.includes(searchQuery))
      );
    }

    // Sort: pending first, then newest first
    return filtered.sort((a, b) => {
      if (a.role === "pending" && b.role !== "pending") return -1;
      if (a.role !== "pending" && b.role === "pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [users, activeTab, searchQuery]);

  // --- STATS ---
  const stats = useMemo(() => {
    const pendingDoctors = users.filter((u) => u.role === "pending" && !u.staff_profile).length;
    const pendingStaff = users.filter((u) => u.role === "pending" && !!u.staff_profile).length;
    return {
      total: users.length,
      patients: users.filter((u) => u.role === "patient").length,
      doctors: users.filter((u) => u.role === "doctor").length,
      staff: users.filter((u) => u.role === "staff").length,
      pendingDoctors,
      pendingStaff,
      totalPending: pendingDoctors + pendingStaff,
    };
  }, [users]);

  // --- ACTIONS ---
  const handleApprove = async (user: User) => {
    const toastId = toast.loading("Approving...");
    try {
      if (user.staff_profile) {
        await usersAPI.approveStaff(user.id);
      } else {
        await usersAPI.approveDoctor(user.id);
      }
      toast.success("User approved successfully.", { id: toastId });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve user.", { id: toastId });
    }
    setActiveDropdown(null);
  };

  const handleReject = async (user: User) => {
    const confirmed = confirm(`Reject ${user.fname} ${user.lname}'s application?`);
    if (!confirmed) return;
    const toastId = toast.loading("Rejecting...");
    try {
      if (user.staff_profile) {
        await usersAPI.rejectStaff(user.id);
      } else {
        await usersAPI.rejectDoctor(user.id);
      }
      toast.success("User rejected.", { id: toastId });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject user.", { id: toastId });
    }
    setActiveDropdown(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredUsers.filter((u) => u.role === "pending").map((u) => u.id);
    if (pendingIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    const toastId = toast.loading(`Approving ${selectedIds.size} users...`);
    setBulkProcessing(true);
    try {
      await usersAPI.bulkApproveUsers(Array.from(selectedIds));
      toast.success(`${selectedIds.size} users approved.`, { id: toastId });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Bulk approve failed.", { id: toastId });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = confirm(`Reject ${selectedIds.size} selected applications? This will delete their accounts.`);
    if (!confirmed) return;
    const toastId = toast.loading(`Rejecting ${selectedIds.size} users...`);
    setBulkProcessing(true);
    try {
      await usersAPI.bulkRejectUsers(Array.from(selectedIds));
      toast.success(`${selectedIds.size} users rejected.`, { id: toastId });
      setSelectedIds(new Set());
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Bulk reject failed.", { id: toastId });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = confirm(
      `Are you sure you want to permanently delete ${user.fname} ${user.lname}? This action cannot be undone.`
    );
    if (!confirmed) return;
    const toastId = toast.loading("Deleting user...");
    try {
      await usersAPI.deleteUser(user.id);
      toast.success("User deleted.", { id: toastId });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user.", { id: toastId });
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

  // --- HELPERS ---
  const getRoleBadge = (user: User) => {
    // For pending users, show what they're pending for
    if (user.role === "pending") {
      const isStaff = !!user.staff_profile;
      return {
        label: isStaff ? "Pending Staff" : "Pending Doctor",
        className: isStaff
          ? "bg-orange-100 text-orange-700 border-orange-200"
          : "bg-amber-100 text-amber-700 border-amber-200",
      };
    }
    const map: Record<string, { label: string; className: string }> = {
      doctor: { label: "Doctor", className: "bg-blue-100 text-blue-700 border-blue-200" },
      staff: { label: "Staff", className: "bg-teal-100 text-teal-700 border-teal-200" },
      patient: { label: "Patient", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      admin: { label: "Admin", className: "bg-purple-100 text-purple-700 border-purple-200" },
    };
    return map[user.role] || { label: user.role, className: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  const getTabCount = (key: TabKey) => {
    switch (key) {
      case "all": return stats.total;
      case "pending_doctors": return stats.pendingDoctors;
      case "pending_staff": return stats.pendingStaff;
      case "doctors": return stats.doctors;
      case "staff": return stats.staff;
      case "patients": return stats.patients;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans text-slate-800 flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col h-full">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">User Management</h1>
              <p className="text-slate-500">View, manage, and approve users in the BukCare system.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatsCard label="Total Users" value={stats.total} icon={UsersIcon} color="bg-blue-50 text-blue-600" />
              <StatsCard label="Patients" value={stats.patients} icon={UserIcon} color="bg-emerald-50 text-emerald-600" />
              <StatsCard label="Doctors" value={stats.doctors} icon={Stethoscope} color="bg-purple-50 text-purple-600" />
              <StatsCard label="Staff" value={stats.staff} icon={Briefcase} color="bg-teal-50 text-teal-600" />
              <StatsCard label="Pending Doctors" value={stats.pendingDoctors} icon={Clock} color="bg-amber-50 text-amber-600" highlight={stats.pendingDoctors > 0} />
              <StatsCard label="Pending Staff" value={stats.pendingStaff} icon={Clock} color="bg-orange-50 text-orange-600" highlight={stats.pendingStaff > 0} />
            </div>

            {/* Tabs */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-2 mb-4 flex flex-wrap gap-1">
              {TABS.map((tab) => {
                const count = getTabCount(tab.key);
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {(count ?? 0) > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      } ${tab.key.startsWith("pending") && !isActive && (count ?? 0) > 0 ? "!bg-rose-100 !text-rose-600 animate-pulse" : ""}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search + Export */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all placeholder-slate-400"
                />
              </div>
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-[#00aeef] transition-all flex items-center gap-2 font-bold shadow-lg shadow-blue-900/10 active:scale-95 flex-shrink-0"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
              <div className="bg-blue-600 text-white rounded-2xl px-5 py-3 mb-4 flex items-center justify-between shadow-lg shadow-blue-600/20 animate-in slide-in-from-top duration-200">
                <span className="font-bold text-sm">{selectedIds.size} user{selectedIds.size > 1 ? "s" : ""} selected</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBulkApprove}
                    disabled={bulkProcessing}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve All
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={bulkProcessing}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject All
                  </button>
                  <button onClick={() => setSelectedIds(new Set())} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

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
                        <th className="px-4 py-5">
                          {filteredUsers.some((u) => u.role === "pending") && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                              checked={filteredUsers.filter((u) => u.role === "pending").every((u) => selectedIds.has(u.id))}
                              onChange={toggleSelectAll}
                            />
                          )}
                        </th>
                        <th className="px-4 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">User Profile</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((user) => {
                        const badge = getRoleBadge(user);
                        return (
                          <tr key={user.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.has(user.id) ? "bg-blue-50/40" : ""}`}>
                            {/* Checkbox */}
                            <td className="px-4 py-4 whitespace-nowrap">
                              {user.role === "pending" && (
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                  checked={selectedIds.has(user.id)}
                                  onChange={() => toggleSelect(user.id)}
                                />
                              )}
                            </td>
                            {/* User Profile */}
                            <td className="px-4 py-4 whitespace-nowrap">
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
                                  <p className="font-bold text-slate-800 text-base">{[user.fname, user.mname, user.lname].filter(Boolean).join(" ")}</p>
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
                              <span className={`px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wide ${badge.className}`}>
                                {badge.label}
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
                                {new Date(user.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

                              {activeDropdown === user.id && (
                                <div className="absolute right-8 top-8 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Manage User</p>
                                  </div>
                                  <button
                                    onClick={() => { navigate(`/admin/users/${user.id}`); setActiveDropdown(null); }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" /> View Details
                                  </button>
                                  {user.role === "pending" && (
                                    <>
                                      <button
                                        onClick={() => handleApprove(user)}
                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                      >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                      </button>
                                      <button
                                        onClick={() => handleReject(user)}
                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2 transition-colors"
                                      >
                                        <XCircle className="w-4 h-4" /> Reject
                                      </button>
                                    </>
                                  )}
                                  {user.role !== "admin" && (
                                    <button
                                      onClick={() => handleDelete(user)}
                                      className="w-full px-4 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete User
                                    </button>
                                  )}
                                </div>
                              )}

                              {activeDropdown === user.id && (
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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

// --- Stats Card ---
const StatsCard = ({ label, value, icon: Icon, color, highlight }: { label: string; value: number; icon: any; color: string; highlight?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-sm border ${highlight ? "border-rose-200 ring-2 ring-rose-100" : "border-white/60"} relative overflow-hidden`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <h3 className={`text-2xl font-extrabold ${highlight ? "text-rose-600" : "text-slate-800"}`}>{value}</h3>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export default Users;