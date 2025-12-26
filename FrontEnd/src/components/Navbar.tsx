import React, { useState, useEffect } from "react";
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
  CheckCheck, // ✅ Icon for "Mark All Read"
  Trash2 // ✅ Icon for "Delete"
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import notificationsAPI from "../services/notifications"; 
import bukcareLogo from "../assets/bukcare_logo.png";
import defaultAvatar from "../assets/default_avatar.png";
import toast from "react-hot-toast";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type?: string;
  timestamp: Date;
  isRead: boolean;
  appointment_id?: number;
}

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lastMessage } = useWebSocket();

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. FETCH HISTORY
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (!user) return;
        const history = await notificationsAPI.getAll();
        
        const formatted = history.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          timestamp: new Date(n.created_at),
          isRead: n.is_read,
          appointment_id: n.appointment_id
        }));

        setNotificationsList(formatted);
        setUnreadCount(formatted.filter((n: any) => !n.isRead).length);
      } catch (error) {
        console.error("Failed to load notification history");
      }
    };

    fetchHistory();
  }, [user]);

  // 2. WEBSOCKET LISTENER
  useEffect(() => {
    if (!lastMessage) return;

    if (!lastMessage.notification && lastMessage.type !== "CHAT_MESSAGE") return;

    let title = "New Notification";
    let messageContent = "You have a new update.";
    let type = lastMessage.type || "info";
    let appointment_id = null;

    if (type === "CHAT_MESSAGE") {
        const senderName = lastMessage.message?.sender_name || "User";
        title = `Message from ${senderName}`;
        messageContent = lastMessage.message?.content || "Sent a message"; 
    } else if (lastMessage.notification) {
        title = lastMessage.notification.title;
        messageContent = lastMessage.notification.message;
        type = lastMessage.notification.type;
        appointment_id = lastMessage.notification.appointment_id;
    }

    const newNotification: NotificationItem = {
      id: Date.now(),
      title,
      message: messageContent,
      type,
      timestamp: new Date(),
      isRead: false,
      appointment_id: appointment_id || undefined
    };

    setNotificationsList((prev) => [newNotification, ...prev]);
    
    if (type !== "CHAT_MESSAGE") {
        setUnreadCount((prev) => prev + 1);
    }

    toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer`}
             onClick={() => {
                 toast.dismiss(t.id);
                 handleNotificationClick(newNotification);
             }}
        >
            <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {type === 'CHAT_MESSAGE' ? <MessageCircle className="w-6 h-6"/> : <Bell className="w-6 h-6"/>}
                        </div>
                    </div>
                    <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">{title}</p>
                        <p className="mt-1 text-sm text-gray-500">{messageContent}</p>
                    </div>
                </div>
            </div>
        </div>
    ), { duration: 4000 });

  }, [lastMessage]);

  // 3. ACTION HANDLERS

  // ✅ Mark ALL as Read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
        await notificationsAPI.markAllRead(); // Ensure API supports this!
        
        // Optimistic Update
        setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All marked as read");
    } catch (error) {
        console.error("Failed to mark all as read");
    }
  };

  // ✅ Delete Notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: number, isRead: boolean) => {
    e.stopPropagation(); // Stop click from navigating
    try {
        await notificationsAPI.delete(id); // Ensure API supports this!
        
        setNotificationsList(prev => prev.filter(n => n.id !== id));
        if (!isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success("Notification removed");
    } catch (error) {
        console.error("Failed to delete notification");
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (notif.type === "CHAT_MESSAGE") {
        navigate(user?.role === 'doctor' ? '/doctor/messages' : '/patient/messages');
    } else if (notif.appointment_id) {
        navigate(user?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments');
    }

    if (!notif.isRead && notif.type !== "CHAT_MESSAGE") {
        try {
            await notificationsAPI.markAsRead(notif.id);
            setNotificationsList(prev => prev.map(n => 
                n.id === notif.id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read");
        }
    }
    setShowNotifications(false);
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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 sticky top-0 z-50 h-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* LEFT - Logo & Mobile Toggle */}
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <Menu className="w-6 h-6" />
              </button>

              <Link to={homeLink} className="flex items-center gap-3 group">
                <div className="relative overflow-hidden rounded-xl shadow-sm transition-transform group-hover:scale-105">
                    <img src={bukcareLogo} alt="BukCare" className="w-10 h-10 object-cover"/>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent hidden sm:block">
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
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    showNotifications || unreadCount > 0 ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-bounce"></span>
                  )}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[60] origin-top-right"
                    >
                      {/* HEADER: Added "Mark all read" button */}
                      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount} New
                                </span>
                            )}
                        </div>
                        
                        {/* ✅ MARK ALL READ BUTTON */}
                        <button 
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                                unreadCount > 0 
                                ? "text-blue-600 hover:bg-blue-100 cursor-pointer" 
                                : "text-slate-400 cursor-not-allowed"
                            }`}
                            title="Mark all as read"
                        >
                            <CheckCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Mark all read</span>
                        </button>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                        {notificationsList.length === 0 ? (
                          <div className="p-8 text-center flex flex-col items-center gap-3">
                             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                 <Bell className="w-6 h-6 text-slate-300" />
                             </div>
                             <p className="text-slate-500 text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-50">
                            {notificationsList.map((notif, index) => (
                              <div 
                                key={notif.id} // Better key than index
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 group ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
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
                                      <h5 className={`text-sm truncate pr-2 ${!notif.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                        {notif.title}
                                      </h5>
                                      {/* ✅ DELETE BUTTON (Visible on hover) */}
                                      <button 
                                        onClick={(e) => handleDeleteNotification(e, notif.id, notif.isRead)}
                                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete notification"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                                  <p className="text-[10px] text-slate-400 mt-2">{notif.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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

              {/* Profile Menu (Unchanged) */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all bg-white"
                >
                  <img src={user.picture || defaultAvatar} alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"/>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="text-xs font-bold text-slate-800 max-w-[100px] truncate">{displayName}</p>
                    <p className="text-[10px] text-slate-500 font-medium capitalize">{userRole}</p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {showProfileDropdown && (
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
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE SIDEBAR (Unchanged structure) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-[100] lg:hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={bukcareLogo} className="w-8 h-8 rounded-lg shadow-sm" alt="Logo" />
                        <span className="font-bold text-lg text-slate-800">BukCare</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-slate-800"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-600 hover:bg-slate-50"}`}>
                                <Icon className="w-5 h-5" /> {item.label}
                            </Link>
                        )
                    })}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-rose-600 shadow-sm"><LogOut className="w-4 h-4" /> Sign Out</button>
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