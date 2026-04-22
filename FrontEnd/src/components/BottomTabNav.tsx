import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Calendar, MessageCircle, User } from "lucide-react";
import { useWebSocket } from "@/context/WebSocketContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/context/AuthContext";

const tabs = [
  { label: "Home", path: "/patient/home", icon: Home },
  { label: "Search", path: "/patient/find-doctor", icon: Search },
  { label: "Bookings", path: "/patient/appointments", icon: Calendar },
  { label: "Chat", path: "/patient/messages", icon: MessageCircle },
  { label: "Profile", path: "/patient/profile", icon: User },
];

const BottomTabNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount: chatUnreadCount } = useWebSocket();
  const { notifications } = useNotifications(user?.id ? Number(user.id) : undefined);

  const apptBadge = notifications.filter(
    (n) => ["NEW_APPOINTMENT", "APPOINTMENT_UPDATE"].includes(n.type) && !n.is_read
  ).length;

  const isActive = (path: string) => {
    if (path === "/patient/home") return location.pathname === "/patient/home";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200/60 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          const badge =
            tab.label === "Chat" ? chatUnreadCount :
            tab.label === "Bookings" ? apptBadge : 0;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 ${
                active ? "text-blue-600" : "text-slate-400"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    active ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  }`}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none mt-0.5 ${
                active ? "font-bold" : ""
              }`}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNav;
