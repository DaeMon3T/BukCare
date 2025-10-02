// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useState, useContext } from "react";
import { Search, Bell, ChevronDown, LogOut, Calendar } from "lucide-react";
import AuthContext from "../context/AuthContext";

export default function Navbar({ role }) {
  const userRole = role || "patient";
  const { user, logout } = useContext(AuthContext);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  let homeLink = `/${userRole}/home`;
  let appointmentsLink = `/${userRole}/appointments`;
  let profileLink = `/${userRole}/profile`;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={homeLink} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-800">BukCare</span>
            </Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search doctors, appointments..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Links */}
            <Link to={appointmentsLink} className="text-gray-700 hover:text-blue-600">
              Appointments
            </Link>

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
                {/* Profile Picture */}
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={user?.picture || "/default-avatar.png"} // database URL or fallback
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
    </header>
  );
}
