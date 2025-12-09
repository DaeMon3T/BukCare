import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  CheckCircle, // Added for icons
  Info         // Added for icons
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
// 1. IMPORT WEBSOCKET HOOK
import { useWebSocket } from "../context/WebSocketContext";

interface NavbarProps {}

interface NotificationItem {
  title: string;
  message: string;
  type?: string;
  timestamp: Date;
}

const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // 2. GET WEBSOCKET DATA
  const { lastMessage } = useWebSocket();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<NotificationItem | null>(null);

  // ------------------------------------------------------------
  // 3. LISTEN FOR MESSAGES
  // ------------------------------------------------------------
  useEffect(() => {
    if (lastMessage) {
      const newNotification = {
        title: lastMessage.title || "New Notification",
        message: lastMessage.message || "You have a new update.",
        type: lastMessage.type,
        timestamp: new Date()
      };

      // Add to list & Increment badge
      setNotificationsList((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show Toast Popup
      setToast(newNotification);

      // Hide Toast after 5 seconds
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastMessage]);

  // Wait until user is loaded
  if (!user) return null;

  const userRole = user.role || "patient";

  const displayName =
    user.name?.trim() ||
    `${user.fname || ""} ${user.lname || ""}`.trim() ||
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
          { label: "Availability", path: "/doctor/set-availability", icon: ClipboardList },
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
  const homeLink = `/${userRole === 'patient' ? 'patient/home' : userRole + '/dashboard'}`;
  const profileLink = `/${userRole}/profile`;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      {/* 🔔 4. TOAST NOTIFICATION POPUP */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="fixed top-24 right-4 z-[100] bg-white border border-blue-100 shadow-xl rounded-xl p-4 w-80 flex items-start gap-3 pointer-events-auto"
          >
            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-sm">{toast.title}</h4>
              <p className="text-gray-600 text-xs mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-2">
          <div className="flex justify-between items-center h-20">
            {/* Left - Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100/80 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-700" />
              </button>

              <Link to={homeLink} className="flex items-center space-x-2">
                <img
                  src="/bukcare_logo.png"
                  alt="BukCare Logo"
                  className="w-20 h-15 object-cover rounded-sm"
                />
                <span className="text-xl font-semibold text-gray-800">BukCare</span>
              </Link>
            </div>

            {/* Center - Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 absolute left-1/2 transform -translate-x-1/2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = window.location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-50/80 text-blue-900 font-bold"
                        : "text-slate-600 hover:text-blue-600 hover:bg-slate-50/80"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right - Actions */}
            <div className="flex items-center space-x-3">
              {/* 🔔 5. NOTIFICATIONS BELL */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) setUnreadCount(0); // Clear badge on open
                  }}
                  className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 rounded-lg transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200/50 flex justify-between">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        <span className="text-xs text-slate-500">{notificationsList.length} New</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notificationsList.length === 0 ? (
                          <div className="p-8 text-slate-500 text-sm text-center">No notifications yet</div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {notificationsList.map((notif, index) => (
                              <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex gap-3">
                                   <div className="mt-1">
                                    {notif.type?.includes('APPROVED') || notif.type === 'success' ? 
                                      <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                      <Info className="w-4 h-4 text-blue-500" />
                                    }
                                   </div>
                                   <div>
                                      <h5 className="text-sm font-medium text-slate-800">{notif.title}</h5>
                                      <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                      <p className="text-[10px] text-slate-400 mt-2">{notif.timestamp.toLocaleTimeString()}</p>
                                   </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-50/80 transition-all"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-slate-200/50">
                    <img
                      src={user.picture || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-800">{displayName}</p>
                    <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/50 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200/50">
                      <p className="font-semibold text-slate-800">{displayName}</p>
                      <p className="text-sm text-slate-600">{user.email || "No email"}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to={profileLink}
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center space-x-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50/80 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                    </div>
                    <div className="border-t border-slate-200/50">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50/80 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar (Kept unchanged) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
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
                className="fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl shadow-2xl z-50 lg:hidden"
              >
                <div className="p-6">
                  {/* ... Same mobile sidebar code as before ... */}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Navbar;