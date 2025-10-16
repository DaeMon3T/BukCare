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
} from "lucide-react";
import AuthContext from "../context/AuthContext.js";

interface NavbarProps {
  role?: "admin" | "doctor" | "staff" | "patient";
}

interface User {
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ role }) => {
  const userRole = role || "patient";

  const { user, logout } = useContext(AuthContext) as AuthContextType;

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔗 Dynamic routes
  const homeLink = `/${userRole}/home`;
  const appointmentsLink = `/${userRole}/appointments`;
  const findDoctorsLink = `/${userRole}/find-doctor`;
  const profileLink = `/${userRole}/profile`;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-3">
            {/* Hamburger menu for mobile */}
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

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Desktop Links */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link to={homeLink} className="text-gray-700 hover:text-blue-600">
                Home
              </Link>

              <Link
                to={findDoctorsLink}
                className="text-gray-700 hover:text-blue-600"
              >
                Find Doctors
              </Link>

              <Link
                to={appointmentsLink}
                className="text-gray-700 hover:text-blue-600"
              >
                Appointments
              </Link>
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

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={user?.picture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">{user?.name || "Guest"}</p>
                  <p className="text-xs text-gray-600 capitalize">{userRole}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">{user?.name || "Guest"}</p>
                    <p className="text-sm text-gray-600">{user?.email || "No email"}</p>
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
                      <LogOut className="inline w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📱 Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
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
                <Link
                  to={homeLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>

                <Link
                  to={findDoctorsLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <Search className="w-5 h-5" />
                  <span>Find Doctors</span>
                </Link>

                <Link
                  to={appointmentsLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <ClipboardList className="w-5 h-5" />
                  <span>Appointments</span>
                </Link>

                <Link
                  to={profileLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600"
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="flex items-center space-x-3 text-red-600 hover:text-red-700 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
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
