// pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import { Clock, CheckCircle, AlertTriangle, Activity, UserPlus, CalendarCheck, User, Bell } from "lucide-react";

import Navbar from "../../components/Navbar";
import InviteModal from "./InviteModal";
import Notification from "../../components/Notification";
import adminAPI from "../../services/admin/AdminAPI";
import AuthContext from "../../context/AuthContext";

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
  const [activities, setActivities] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([loadDashboardStats(), loadRecentActivities()]);
  };

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

  const loadRecentActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const data = await adminAPI.getRecentActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to load recent activities:", error);
      showNotification("error", "Failed to load recent activities");
    } finally {
      setIsLoadingActivities(false);
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
    loadRecentActivities();
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const closeNotification = () => setNotification(null);

  const getRoleIcon = (role) => {
    switch (role) {
      case "doctor":
        return <User className="w-4 h-4" />;
      case "staff":
        return <User className="w-4 h-4" />;
      case "patient":
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "user_registered":
        return <UserPlus className="w-5 h-5 text-green-600" />;
      case "appointment_scheduled":
        return <CalendarCheck className="w-5 h-5 text-blue-600" />;
      case "invitation_sent":
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case "user_approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

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

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
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
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Recent Activity
                </h2>

                {isLoadingActivities ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {activities.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                      View All Activity →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
