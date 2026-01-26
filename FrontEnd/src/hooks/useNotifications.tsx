import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "@/context/WebSocketContext"; 
import { useAuth } from "@/context/AuthContext"; 
import api from "@/services/api"; 

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

  // 2. Handle Real-Time Messages (UPDATE LIST ONLY)
  useEffect(() => {
    if (!lastMessage) return;

    // 🛑 STOP! FILTER OUT CHAT MESSAGES
    // The Bell Icon should NOT show Chat Messages (those go to the Inbox)
    if (
        lastMessage.type === "CHAT_MESSAGE" || 
        lastMessage.type === "TYPING_START" || 
        lastMessage.type === "TYPING_STOP" ||
        lastMessage.type === "MESSAGE_DELETED"
    ) {
        return; 
    }

    // --- SHIELD 1: STALE CHECK ---
    const messageTime = new Date(lastMessage.created_at || Date.now()).getTime();
    const now = Date.now();
    if (now - messageTime > 5000) return; 

    // --- SHIELD 2: ROBUST ID GENERATION ---
    const rawId = lastMessage.id || lastMessage.message?.id;
    const contentHash = lastMessage.message?.content || lastMessage.message || "unknown";
    const uniqueKey = rawId ? `id-${rawId}` : `content-${lastMessage.type}-${contentHash}`;

    // Dedupe Check
    if (globalProcessedIds.has(uniqueKey)) return;
    globalProcessedIds.add(uniqueKey);

    // ✅ REMOVED: Sound & Toast logic (Moved to WebSocketContext)
    // This hook is NOW only responsible for updating the Notification List (Bell Icon)

    // Data Prep
    let displayTitle = lastMessage.title || "Notification";
    let displayMessage = typeof lastMessage.message === 'string' 
        ? lastMessage.message 
        : (lastMessage.message?.content || "You have a new update");
    
    let messageType = lastMessage.type || "info";
    let appointmentId = lastMessage.appointment_id || lastMessage.message?.appointment_id;

    // Update State (Add to Bell List)
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
    setUnreadCount((prev) => prev + 1);

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