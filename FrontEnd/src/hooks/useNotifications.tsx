import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "@/context/WebSocketContext"; 
import { useAuth } from "@/context/AuthContext"; 
import api from "@/services/api"; 
import toast from "react-hot-toast";
import notificationSound from "@/assets/sounds/notification2.mp3";
import { MessageCircle, Bell, X, CheckCircle } from "lucide-react"; 

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  appointment_id?: number;
}

// Global Set to track seen messages across page navigation
const globalProcessedIds = new Set<string>();

export const useNotifications = (userId?: number) => {
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Fetch Initial Notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await api.get("/notifications/?limit=20");
      setNotifications(res.data);
      const countRes = await api.get("/notifications/unread-count");
      setUnreadCount(countRes.data.unread_count);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 2. Handle Real-Time Messages (The Super-Deduping Logic)
  useEffect(() => {
    if (!lastMessage) return;

    // --- SHIELD 1: STALE CHECK ---
    // If the message is older than 5 seconds, ignore it. 
    // This prevents "notification blasts" when you refresh the page.
    const messageTime = new Date(lastMessage.created_at || Date.now()).getTime();
    const now = Date.now();
    if (now - messageTime > 5000) {
        // console.log("Skipping stale message:", lastMessage);
        return; 
    }

    // --- SHIELD 2: ROBUST ID GENERATION ---
    // If there is no ID, we create one from the content. 
    // This stops "ghost" messages with no IDs from showing up multiple times.
    const rawId = lastMessage.id || lastMessage.message?.id;
    const contentHash = lastMessage.message?.content || lastMessage.message || "unknown";
    
    // Unique Key: Uses ID if available, otherwise uses the text content + type
    const uniqueKey = rawId ? `id-${rawId}` : `content-${lastMessage.type}-${contentHash}`;

    // Dedupe Check
    if (globalProcessedIds.has(uniqueKey)) return;
    globalProcessedIds.add(uniqueKey);

    // --- FROM HERE, IT'S THE SAME TOAST LOGIC ---

    // Play Sound
    try {
      const audio = new Audio(notificationSound);
      audio.play().catch(() => {}); 
    } catch (err) {
      console.error("Audio error:", err);
    }

    // Data Prep
    let displayMessage = "";
    let displayTitle = "New Notification";
    let messageType = lastMessage.type || "info";
    let appointmentId = lastMessage.appointment_id || lastMessage.message?.appointment_id;

    if (messageType === "CHAT_MESSAGE") {
        const chatData = lastMessage.message;
        displayTitle = chatData.sender_name || "New Message";
        displayMessage = chatData.content; 
    } else {
        displayTitle = lastMessage.title || "Notification";
        // Ensure message is a string, not an object
        displayMessage = typeof lastMessage.message === 'string' 
            ? lastMessage.message 
            : (lastMessage.message?.content || "You have a new update");
    }

    // CUSTOM TOAST UI
    toast.custom((t) => (
      <div
        onClick={() => {
            toast.dismiss(t.id);
            const baseRoute = user?.role === 'doctor' ? '/doctor' : '/patient';
            
            if (messageType === "CHAT_MESSAGE") {
                navigate(`${baseRoute}/messages`);
            } else if (appointmentId) {
                navigate(`${baseRoute}/appointments`);
            }
        }}
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 cursor-pointer hover:bg-slate-50 transition-colors`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
               <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                   messageType === 'CHAT_MESSAGE' ? 'bg-purple-100 text-purple-600' : 
                   messageType === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
               }`}>
                  {messageType === 'CHAT_MESSAGE' ? <MessageCircle className="w-6 h-6"/> : 
                   messageType === 'success' ? <CheckCircle className="w-6 h-6"/> : <Bell className="w-6 h-6"/>}
               </div>
            </div>
            
            <div className="ml-3 flex-1">
              <p className="text-sm font-bold text-slate-900">{displayTitle}</p>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                {displayMessage}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-slate-100">
          <button
            onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-slate-400 hover:text-slate-500 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    ), { duration: 5000, position: "top-right" });

    // Update State
    const newNotif: Notification = {
        id: rawId || Date.now(),
        title: displayTitle,
        message: displayMessage, 
        type: messageType,
        is_read: false,
        created_at: new Date().toISOString(),
        appointment_id: appointmentId
    };

    setNotifications((prev) => [newNotif, ...prev]);
    if (messageType !== "CHAT_MESSAGE") {
        setUnreadCount((prev) => prev + 1);
    }

  }, [lastMessage, user, navigate]);

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try { await api.patch("/notifications/mark-all-read"); } catch (err) { console.error("Failed to mark read"); }
  };

  const markAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await api.patch(`/notifications/${id}/read`); } catch (err) { console.error("Failed to mark notification as read"); }
  };

  const deleteNotification = async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const wasUnread = notifications.find(n => n.id === id)?.is_read === false;
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    try { await api.delete(`/notifications/${id}`); } catch (err) { console.error("Failed to delete notification"); }
  }

  return { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    markAsRead, 
    deleteNotification,
    refresh: fetchNotifications 
  };
};