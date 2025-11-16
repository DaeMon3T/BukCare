import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Home,
  User,
  ClipboardList,
  Search,
  Users,
  Calendar,
} from "lucide-react";
import AuthContext from "../context/AuthContext.js";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useContext(AuthContext);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Wait until user is loaded
  if (!user) return null; // <-- prevents showing patient by default

  const userRole = user.role || "patient";

  const displayName =
    user.name?.trim() ||
    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
    "Guest";

  const getNavigationItems = () => {
    switch (userRole) {
      case "admin":
        return [
          { label: "Dashboard", path: "/admin/dashboard", icon: Home },
          { label: "Users", path: "/admin/users", icon: Users },
        ];
      case "doctor":
        return [
          { label: "Dashboard", path: "/doctor/dashboard", icon: Home },
          { label: "Appointments", path: "/doctor/appointments", icon: Calendar },
          { label: "Patients", path: "/doctor/patients", icon: Users },
        ];
      case "patient":
      default:
        return [
          { label: "Home", path: "/patient/home", icon: Home },
          { label: "Find Doctors", path: "/patient/find-doctor", icon: Search },
          { label: "Appointments", path: "/patient/appointments", icon: ClipboardList },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  const homeLink =
    userRole === "admin"
      ? "/admin/dashboard"
      : userRole === "doctor"
      ? "/doctor/dashboard"
      : "/patient/home";

  const profileLink = `/${userRole}/profile`;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left */}
          <div className="flex items-center space-x-3">
            {/* Hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </button>

            {/* Logo */}
            <Link to={homeLink} className="flex items-center space-x-2">
              <img
                src="/bukcare-logo.svg"
                alt="BukCare Logo"
                className="w-5 h-5 object-cover rounded-sm"
              />
              <span className="text-xl font-semibold text-gray-800">BukCare</span>
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center space-x-4">
            {/* Desktop Links */}
            <div className="hidden lg:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-300 text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                  </div>
                  <div className="p-4 text-gray-500 text-sm text-center">
                    No notifications yet
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={user.picture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">{displayName}</p>
                  <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{displayName}</p>
                    <p className="text-sm text-gray-600">{user.email || "No email"}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      to={profileLink}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Profile
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="inline w-4 h-4 mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 p-4"
            >
              <div className="flex justify-between items-center mb-6">
                <Link to={homeLink} className="flex items-center space-x-2">
                  <img
                    src="/bukcare-logo.svg"
                    alt="BukCare Logo"
                    className="w-5 h-5 object-cover rounded-sm"
                  />
                  <span className="text-xl font-semibold text-gray-800">BukCare</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <nav className="space-y-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link
                  to={profileLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <User className="w-5 h-5" /> <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="flex items-center space-x-3 text-red-600 hover:text-red-700 w-full"
                >
                  <LogOut className="w-5 h-5" /> <span>Logout</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
