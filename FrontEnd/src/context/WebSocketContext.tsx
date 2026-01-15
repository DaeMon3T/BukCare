import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast"; 
import messagesAPI from "@/services/messages"; 
import notificationSound from "@/assets/sounds/notification2.mp3"; 

interface WebSocketMessage {
  type: string;
  payload?: any;
  message?: any; 
  notification?: any; 
  _receivedAt?: number;
  id?: number;
  title?: string;
  created_at?: string;
  appointment_id?: number;
  status?: string;
  new_date?: string;
  sender_id?: number;
  receiver_id?: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  unreadCount: number; 
  markAsReadGlobally: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  // Unread Badge State
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial Load of Unread Count
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const convos = await messagesAPI.getConversations();
      // Sum up all unread_counts from all conversations
      const total = convos.reduce((acc: number, curr: any) => acc + (curr.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  }, [user]);

  // Load count on mount/login
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);


  // ... (Socket URL logic remains the same)
  const getSocketUrl = (userId: string | number) => {
    let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    if (!baseUrl.startsWith("http")) {
        baseUrl = `http://${baseUrl}`;
    }
    try {
        const urlObj = new URL(baseUrl);
        const wsProtocol = urlObj.protocol === "https:" ? "wss" : "ws";
        const host = urlObj.host; 
        return `${wsProtocol}://${host}/v1/notifications/ws/${userId}`;
    } catch (error) {
        return `ws://localhost:8000/v1/notifications/ws/${userId}`;
    }
  };

  const connect = useCallback(() => {
    if (!user?.id) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return; 

    const url = getSocketUrl(user.id);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WS Connected");
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        const messageWithTimestamp = {
            ...rawData,
            _receivedAt: Date.now()
        };
        
        setLastMessage(messageWithTimestamp);
        handleGlobalToast(messageWithTimestamp);

      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.onclose = () => {
      console.log("WS Disconnected");
      setIsConnected(false);
      socketRef.current = null;
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => connect(), 3000); 
      }
    };

    ws.onerror = (_error) => {
      ws.close(); 
    };

    socketRef.current = ws;
  }, [user?.id, refreshUnreadCount]); 

  useEffect(() => {
    if (user?.id) {
      connect();
    }
    return () => {
      socketRef.current?.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [user, connect]);


  // SMART NOTIFICATION LOGIC
  const handleGlobalToast = (msg: any) => {
    
    // CASE A: Chat Message
    if (msg.type === "CHAT_MESSAGE") {
        // 1. Update Badge Logic
        setUnreadCount(prev => prev + 1);

        // PLAY SOUND GLOBALLY (Added this part)
        try {
            const audio = new Audio(notificationSound);
            audio.play().catch(e => console.log("Audio play failed (interaction needed)", e));
        } catch (e) {}

        // Smart Toast Logic
        // Check if user is currently looking at messages
        const isOnMessagesPage = window.location.pathname.includes('/messages');
        
        // Stop! Don't show toast if we are already on the messages page
        if (isOnMessagesPage) {
            return; 
        }

        // Otherwise, show the popup
        toast(
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                 {msg.message?.sender_picture && <img src={msg.message.sender_picture} className="w-full h-full object-cover"/>}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">{msg.message?.sender_name || "New Message"}</p>
                <p className="text-xs text-slate-500 truncate max-w-[150px]">{msg.message?.content}</p>
              </div>
            </div>, 
            { duration: 4000, position: "top-right" }
        );
    } 
    
    // CASE B: System Notifications (Keep existing logic)
    else if (msg.type === "NEW_APPOINTMENT") {
       toast.success(msg.notification?.message || "New Appointment");
    } 
    else if (msg.type === "APPOINTMENT_UPDATE") {
       toast(msg.notification?.message || "Appointment Updated", {
         icon: 'ℹ️',
         duration: 4000,
       });
    }
  };

  return (
    <WebSocketContext.Provider value={{ 
        isConnected, 
        lastMessage, 
        unreadCount, 
        markAsReadGlobally: refreshUnreadCount 
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within a WebSocketProvider");
  return context;
};