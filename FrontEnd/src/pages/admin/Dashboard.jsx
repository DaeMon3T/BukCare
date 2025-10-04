// pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { AlertTriangle, UserPlus, User } from "lucide-react";

import Navbar from "@/components/Navbar";
import InviteModal from "./InviteModal";
import Notification from "@/components/Notification";
import adminAPI from "@/services/admin/AdminAPI";
import AuthContext from "@/context/AuthContext";

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);

  // UI State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Data State
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    total_staff: 0,
    pending_approvals: 0,
    active_sessions: 0,
    pending_invites: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminAPI.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      showNotification("error", "Failed to load dashboard statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Debounced search
  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await adminAPI.searchUsers(query);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        showNotification("error", "Search failed. Please try again.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  const handleInvitationSent = (result) => {
    setNotification(result);
    loadDashboardStats();
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => setNotification(null);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden">
      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      {/* Invite Modal */}
      <InviteModal
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        onInvitationSent={handleInvitationSent}
      />

      {/* Navbar */}
      <Navbar role="admin" />

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || "Admin"}!
              </h1>
              <p className="text-purple-100">
                Manage your healthcare platform. Monitor users and send invitations
                to new team members.
              </p>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Patients */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Patients</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {isLoadingStats ? "..." : stats.total_patients.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Doctors */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Doctors</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {isLoadingStats ? "..." : stats.total_doctors.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Staff */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Staff</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {isLoadingStats ? "..." : stats.total_staff.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium">Invite New User</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-600 mb-3">
                  System Status
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="text-sm font-medium text-gray-800">
                      {isLoadingStats ? "..." : stats.active_sessions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Invites</span>
                    <span className="text-sm font-medium text-gray-800">
                      {isLoadingStats ? "..." : stats.pending_invites}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending Approvals</span>
                    <div className="flex items-center space-x-1">
                      {stats.pending_approvals > 0 && (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {isLoadingStats ? "..." : stats.pending_approvals}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Users Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Search Users
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {result.name}
                          </p>
                          <p className="text-xs text-gray-600">{result.email}</p>
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {result.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="mt-4 text-center py-8">
                  <p className="text-gray-500 text-sm">No users found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;