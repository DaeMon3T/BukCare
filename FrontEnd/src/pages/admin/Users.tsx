import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

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
  // Mock data for demonstration
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      fname: "John",
      lname: "Doe",
      email: "john.doe@example.com",
      contact_number: "+63 912 345 6789",
      role: "patient",
      is_active: true,
      is_verified: true,
      is_profile_complete: true,
      created_at: "2024-01-15T10:30:00Z",
      picture: "/default-avatar.png"
    },
    {
      id: 2,
      fname: "Jane",
      lname: "Smith",
      email: "jane.smith@example.com",
      contact_number: "+63 923 456 7890",
      role: "doctor",
      is_active: true,
      is_verified: true,
      is_profile_complete: true,
      created_at: "2024-02-20T14:20:00Z",
      picture: "/default-avatar.png"
    },
    {
      id: 3,
      fname: "Michael",
      mname: "Lee",
      lname: "Johnson",
      email: "michael.johnson@example.com",
      contact_number: "+63 934 567 8901",
      role: "pending",
      is_active: false,
      is_verified: false,
      is_profile_complete: false,
      created_at: "2024-03-10T09:15:00Z",
      picture: "/default-avatar.png"
    },
    {
      id: 4,
      fname: "Sarah",
      lname: "Williams",
      email: "sarah.williams@example.com",
      contact_number: "+63 945 678 9012",
      role: "patient",
      is_active: true,
      is_verified: true,
      is_profile_complete: true,
      created_at: "2024-01-25T16:45:00Z",
      picture: "/default-avatar.png"
    },
    {
      id: 5,
      fname: "David",
      lname: "Brown",
      email: "david.brown@example.com",
      contact_number: "+63 956 789 0123",
      role: "doctor",
      is_active: true,
      is_verified: true,
      is_profile_complete: true,
      created_at: "2024-02-05T11:30:00Z",
      picture: "/default-avatar.png"
    },
  ]);

  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [stats] = useState<DashboardStats>({
    total_patients: 2,
    total_doctors: 2,
    total_staff: 1,
    pending_approvals: 1,
    active_sessions: 4,
    pending_invites: 1,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "doctor" | "pending">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const loading = false;
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Filter and search logic
  useEffect(() => {
    let filtered = users;

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => 
        statusFilter === "active" ? user.is_active : !user.is_active
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.fname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lname.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.contact_number && user.contact_number.includes(searchQuery))
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleApproveDoctor = (userId: number) => {
    // UI-only: Update the user status locally
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId
          ? { ...user, role: "doctor", is_active: true, is_verified: true }
          : user
      )
    );
    setActiveDropdown(null);
    alert("Doctor approved successfully! (UI Demo - No API call)");
  };

  const handleAction = (action: string, userId: number) => {
    console.log(`${action} user:`, userId);
    alert(`Action: ${action} for user ID: ${userId} (UI Demo - No API call)`);
    setActiveDropdown(null);
  };

  const handleExport = () => {
    const csv = [
      ["ID", "Name", "Email", "Phone", "Role", "Status", "Verified", "Profile Complete", "Join Date"],
      ...filteredUsers.map(user => [
        user.id,
        `${user.fname} ${user.lname}`,
        user.email,
        user.contact_number || "N/A",
        user.role,
        user.is_active ? "Active" : "Inactive",
        user.is_verified ? "Yes" : "No",
        user.is_profile_complete ? "Yes" : "No",
        new Date(user.created_at).toLocaleDateString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "doctor":
        return "bg-purple-100 text-purple-700";
      case "patient":
        return "bg-green-100 text-green-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const totalUsers = stats.total_patients + stats.total_doctors + stats.total_staff;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
          <p className="text-gray-600">Manage patients and doctors in the system</p>
        </div>

        {/* Demo Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="font-semibold text-blue-800 mb-2">💡 UI Demo Mode</p>
          <p className="text-sm text-blue-700">
            This is a UI-only demonstration with mock data. API integration can be added later.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Patients</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_patients}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Doctors</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_doctors}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pending_approvals}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Doctors</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={user.picture || "/default-avatar.png"}
                            alt={`${user.fname} ${user.lname}`}
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {user.fname} {user.mname ? `${user.mname} ` : ""}{user.lname}
                            </p>
                            <p className="text-xs text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          {user.contact_number && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {user.contact_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs">
                            {user.is_verified ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-gray-600">
                              {user.is_verified ? "Verified" : "Not Verified"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {user.is_profile_complete ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-gray-600">
                              Profile {user.is_profile_complete ? "Complete" : "Incomplete"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActiveDropdown(activeDropdown === user.id ? null : user.id)
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>

                          {activeDropdown === user.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                              <button
                                onClick={() => handleAction("view", user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAction("edit", user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit User
                              </button>
                              {user.role === "pending" && (
                                <button
                                  onClick={() => handleApproveDoctor(user.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve Doctor
                                </button>
                              )}
                              <button
                                onClick={() => handleAction("delete", user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>
    </div>
  );
};

export default Users;