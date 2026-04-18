import React, { useState, useMemo, useCallback } from "react";
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
  Trash2,
  UserPlus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications"; 
import { useWebSocket } from "@/context/WebSocketContext"; 
import logo from "@/assets/images/icon_logo_name.png";
import defaultAvatar from "@/assets/images/default_avatar.png";

interface NavItem {
    label: string;
    path: string;
    icon: any;
    badge?: number;
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { unreadCount: chatUnreadCount } = useWebSocket(); 

  const { 
    notifications, 
    unreadCount: systemUnreadCount, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification 
  } = useNotifications(user?.id ? Number(user.id) : undefined);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const badgeCounts = useMemo(() => {
    return {
        messages: chatUnreadCount, 
        appointments: notifications.filter(n => ['NEW_APPOINTMENT', 'APPOINTMENT_UPDATE'].includes(n.type) && !n.is_read).length
    };
  }, [notifications, chatUnreadCount]);

  const handleNotificationClick = useCallback(async (notif: any) => {
    if (!notif.is_read) {
        markAsRead(Number(notif.id));
    }

    const baseRole = user?.role === 'doctor' ? '/doctor' : user?.role === 'staff' ? '/staff' : '/patient';
    if (notif.type === "CHAT_MESSAGE") {
        const senderId = notif.sender_id || notif.message?.sender_id; 
        if (senderId) {
            navigate(`${baseRole}/messages?userId=${senderId}`);
        } else {
            navigate(`${baseRole}/messages`);
        }
    } else if (notif.appointment_id || notif.type.includes('APPOINTMENT')) {
        navigate(`${baseRole}/appointments`);
    }
    setShowNotifications(false);
    setSidebarOpen(false); 
  }, [navigate, user?.role, markAsRead]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const navigationItems = useMemo(() => {
    const role = user?.role || "patient";
    let items: NavItem[] = [];

    switch (role) {
      case "admin":
        items = [
          { label: "Dashboard", path: "/admin/dashboard", icon: Home },
          { label: "Appointments", path: "/admin/appointments", icon: Calendar, badge: badgeCounts.appointments },
          { label: "Users", path: "/admin/users", icon: Users },
        ];
        break;
      case "doctor":
        items = [
          { label: "Dashboard", path: "/doctor/dashboard", icon: Home },
          { label: "Appointments", path: "/doctor/appointments", icon: Calendar, badge: badgeCounts.appointments },
          { label: "Availability", path: "/doctor/set-availability", icon: ClipboardList },
          { label: "Messages", path: "/doctor/messages", icon: MessageCircle, badge: badgeCounts.messages },
        ];
        break;
      case "staff":
        items = [
          { label: "Dashboard", path: "/staff/dashboard", icon: Home },
          { label: "Appointments", path: "/staff/appointments", icon: Calendar, badge: badgeCounts.appointments },
          { label: "Messages", path: "/staff/messages", icon: MessageCircle, badge: badgeCounts.messages },
          { label: "Walk-ins", path: "/staff/walk-in", icon: UserPlus },
          { label: "Scan", path: "/staff/scan", icon: Search },
        ];
        break;
      case "patient":
      default:
        items = [
          { label: "Home", path: "/patient/home", icon: Home },
          { label: "Find Doctors", path: "/patient/find-doctor", icon: Search },
          { label: "Appointments", path: "/patient/appointments", icon: ClipboardList, badge: badgeCounts.appointments },
          { label: "Messages", path: "/patient/messages", icon: MessageCircle, badge: badgeCounts.messages },
        ];
        break;
    }
    return items;
  }, [user?.role, badgeCounts]);

  if (!user) return null;

  const userRole = user.role || "patient";
  const displayName = user.name?.trim() || `${user.fname || ""} ${user.lname || ""}`.trim() || "Guest";
  const homeLink = `/${userRole === 'patient' ? 'patient/home' : userRole + '/dashboard'}`;
  const profileLink = `/${userRole}/profile`;
  const isPatientUser = userRole === "patient";

  const isPathActive = useCallback((path: string) => {
    if (location.pathname === path) return true;
    if (path === "/patient/find-doctor") {
      return (
        location.pathname.startsWith("/patient/find-doctor") ||
        location.pathname.startsWith("/patient/book/") ||
        location.pathname.startsWith("/patient/doctor/")
      );
    }
    if (path === "/patient/appointments") {
      return location.pathname.startsWith("/patient/appointments");
    }
    if (path === "/patient/messages") {
      return location.pathname.startsWith("/patient/messages");
    }
    if (path === "/patient/home") {
      return location.pathname.startsWith("/patient/home");
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 h-16 border-b border-white/70 bg-white/70 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-200 md:h-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2 md:gap-4">
              {!isPatientUser && (
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              )}
              <Link to={homeLink} className="flex items-center gap-2 md:gap-3 group">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                    <img src={logo} className="h-16 w-auto object-contain transition-all duration-300 md:h-20" alt="BukCare Logo" />
                </div>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "fill-current" : ""}`} />
                    {item.label}
                    {(item.badge || 0) > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center leading-none shadow-sm animate-in zoom-in duration-200">
                            {item.badge && item.badge > 9 ? '9+' : item.badge}
                        </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 md:p-2.5 rounded-xl transition-all ${
                    showNotifications || systemUnreadCount > 0 ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Bell className="w-5 h-5 md:w-5 md:h-5" />
                  {systemUnreadCount > 0 && (
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
                            {systemUnreadCount > 0 && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{systemUnreadCount} New</span>}
                        </div>
                        <button onClick={markAllAsRead} disabled={systemUnreadCount === 0} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${systemUnreadCount > 0 ? "text-blue-600 hover:bg-blue-100 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}>
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                      </div>
                      <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center gap-3">
                             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center"><Bell className="w-6 h-6 text-slate-300" /></div>
                             <p className="text-slate-500 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group ${!notif.is_read ? 'bg-blue-50/40' : ''}`}>
                                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'CHAT_MESSAGE' ? 'bg-purple-100 text-purple-600' : notif.type?.includes('success') ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {notif.type === 'CHAT_MESSAGE' ? <MessageCircle className="w-4 h-4"/> : notif.type?.includes('success') ? <CheckCircle className="w-4 h-4"/> : <Info className="w-4 h-4"/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-0.5">
                                      <h5 className={`text-sm truncate pr-2 ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{notif.title}</h5>
                                      <button onClick={(e) => { e.stopPropagation(); deleteNotification(Number(notif.id)); }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all opacity-100 md:opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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

              <div className="relative">
                <button onClick={() => setShowProfileDropdown(!showProfileDropdown)} className="flex items-center gap-2 md:gap-3 rounded-full border border-slate-200 bg-white p-1 pr-2 transition-all hover:border-blue-300 hover:bg-blue-50/50 md:p-1.5 md:pr-3">
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
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] origin-top-right">
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

      {isPatientUser && (
        <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-[1.75rem] border border-white/15 bg-slate-950/92 p-2 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.8)] backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-4 gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isPathActive(item.path);
              return (
                <Link key={`mobile-${item.path}`} to={item.path} className={`relative flex flex-col items-center gap-1 rounded-[1.2rem] px-2 py-3 text-[11px] font-semibold transition-all ${isActive ? "bg-white text-slate-950 shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                  <div className="relative">
                    <Icon className="h-4.5 w-4.5" />
                    {(item.badge || 0) > 0 && <span className={`absolute -right-2 -top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${isActive ? "bg-rose-500 text-white" : "bg-sky-400 text-slate-950"}`}>{item.badge && item.badge > 9 ? "9+" : item.badge}</span>}
                  </div>
                  <span>{item.label.replace("Find ", "")}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-[100] lg:hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <Link to={homeLink} className="flex items-center gap-2 md:gap-3 group">
                    <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                        <img src={logo} className="h-16 w-auto object-contain transition-all duration-300 md:h-20" alt="BukCare Logo" />
                    </div>
                </Link>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 bg-white rounded-full text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {navigationItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isPathActive(item.path);
                      return (
                          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-slate-50"}`}>
                              <div className="flex items-center gap-4"><Icon className="w-5 h-5" /> {item.label}</div>
                              {(item.badge || 0) > 0 && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'}`}>{item.badge && item.badge > 9 ? '9+' : item.badge}</span>}
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
