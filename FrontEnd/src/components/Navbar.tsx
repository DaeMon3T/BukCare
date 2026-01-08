import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  CheckCircle,
  Info,
  MessageCircle,
  CheckCheck, 
  Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications"; 
import bukcareLogo from "@/assets/images/bukcare_logo.png";
import defaultAvatar from "@/assets/images/default_avatar.png";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
  } = useNotifications(user?.id ? Number(user.id) : undefined);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- ACTION HANDLERS ---
  
  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
        markAsRead(Number(notif.id));
    }

    if (notif.type === "CHAT_MESSAGE") {
        navigate(user?.role === 'doctor' ? '/doctor/messages' : '/patient/messages');
    } else if (notif.appointment_id) {
        navigate(user?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments');
    }

    setShowNotifications(false);
    setSidebarOpen(false); // Close sidebar if navigating from there
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  const userRole = user.role || "patient";
  const displayName = user.name?.trim() || `${user.fname || ""} ${user.lname || ""}`.trim() || "Guest";

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
          { label: "Messages", path: "/doctor/messages", icon: MessageCircle },
        ];
      case "patient":
      default:
        return [
          { label: "Home", path: "/patient/home", icon: Home },
          { label: "Find Doctors", path: "/patient/find-doctor", icon: Search },
          { label: "Appointments", path: "/patient/appointments", icon: ClipboardList },
          { label: "Messages", path: "/patient/messages", icon: MessageCircle },
        ];
    }
  };

  const navigationItems = getNavigationItems();
  const homeLink = `/${userRole === 'patient' ? 'patient/home' : userRole + '/dashboard'}`;
  const profileLink = `/${userRole}/profile`;

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 sticky top-0 z-40 h-16 md:h-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* LEFT - Logo & Mobile Toggle */}
            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <Menu className="w-6 h-6" />
              </button>

              <Link to={homeLink} className="flex items-center gap-2 md:gap-3 group">
                <div className="relative overflow-hidden rounded-xl shadow-sm transition-transform group-hover:scale-105">
                    <img src={bukcareLogo} alt="BukCare" className="w-8 h-8 md:w-10 md:h-10 object-cover"/>
                </div>
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-700 to-[#2dc7f8] bg-clip-text text-transparent hidden sm:block">
                  BukCare
                </span>
              </Link>
            </div>

            {/* CENTER - Desktop Nav */}
            <nav className="hidden lg:flex items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "fill-current" : ""}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT - Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* --- NOTIFICATIONS BELL --- */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 md:p-2.5 rounded-xl transition-all ${
                    showNotifications || unreadCount > 0 ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Bell className="w-5 h-5 md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 md:right-2.5 w-2 md:w-2.5 h-2 md:h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                    <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-[-60px] md:right-0 mt-3 w-[90vw] max-w-[350px] md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] origin-top-right"
                    >
                      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        <button 
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                                unreadCount > 0 
                                ? "text-blue-600 hover:bg-blue-100 cursor-pointer" 
                                : "text-slate-400 cursor-not-allowed"
                            }`}
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                      </div>

                      <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center gap-3">
                             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                 <Bell className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-slate-500 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group ${!notif.is_read ? 'bg-blue-50/40' : ''}`}
                              >
                                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    notif.type === 'CHAT_MESSAGE' ? 'bg-purple-100 text-purple-600' : 
                                    notif.type?.includes('success') ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {notif.type === 'CHAT_MESSAGE' ? <MessageCircle className="w-4 h-4"/> : 
                                   notif.type?.includes('success') ? <CheckCircle className="w-4 h-4"/> : <Info className="w-4 h-4"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-0.5">
                                      <h5 className={`text-sm truncate pr-2 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                        {notif.title}
                                      </h5>
                                      <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(Number(notif.id));
                                        }}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2">
                                      {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* --- PROFILE MENU --- */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 pr-2 md:pr-3 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all bg-white"
                >
                  <img src={user.picture || defaultAvatar} alt="Profile" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover ring-2 ring-white shadow-sm"/>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-800 max-w-[100px] truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">{userRole}</p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
                    <>
                    <div className="fixed inset-0 z-[55]" onClick={() => setShowProfileDropdown(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] origin-top-right"
                    >
                      <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                        <p className="font-bold text-slate-800 truncate">{displayName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link to={profileLink} onClick={() => setShowProfileDropdown(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors">
                          <User className="w-4 h-4" /> My Profile
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header> 
      {/* 👈 HEADER ENDS HERE NOW */}

      {/* 👇 MOBILE SIDEBAR MOVED OUTSIDE HEADER */}
      {/* This ensures 'fixed' works relative to the entire screen, not just the blurry header */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden" 
              onClick={() => setSidebarOpen(false)} 
            />
            <motion.div 
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }} 
              className="fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-[100] lg:hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                      <img src={bukcareLogo} className="w-8 h-8 rounded-lg shadow-sm" alt="Logo" />
                      <span className="font-bold text-lg text-slate-800">BukCare</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white rounded-full text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
              </div>
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                          <Link 
                            key={item.path} 
                            to={item.path} 
                            onClick={() => setSidebarOpen(false)} 
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                              isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                              <Icon className="w-5 h-5" /> {item.label}
                          </Link>
                      )
                  })}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-600 shadow-sm hover:bg-rose-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;