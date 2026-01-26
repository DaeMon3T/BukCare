import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast"; 
import messagesAPI from "@/services/messages"; 
import notificationSound from "@/assets/sounds/notification2.mp3"; 
// ✅ 1. IMPORT NAVIGATE
import { useNavigate } from "react-router-dom";

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
  // ✅ 2. INITIALIZE NAVIGATE
  const navigate = useNavigate();
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const convos = await messagesAPI.getConversations();
      const total = convos.reduce((acc: number, curr: any) => acc + (curr.unread_count || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.error("Failed to load unread count", err);
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

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


  const handleGlobalToast = (msg: any) => {
    if (msg.type === "CHAT_MESSAGE") {
        setUnreadCount(prev => prev + 1);

        try {
            const audio = new Audio(notificationSound);
            audio.play().catch(e => console.log("Audio play failed", e));
        } catch (e) {}

        const isOnMessagesPage = window.location.pathname.includes('/messages');
        if (isOnMessagesPage) return; 

        // ✅ CLICKABLE TOAST
        toast((t) => (
            <div 
                className="cursor-pointer flex items-center gap-3 w-full"
                onClick={() => {
                    toast.dismiss(t.id);
                    const baseRole = user?.role === 'doctor' ? '/doctor' : '/patient';
                    
                    // ✅ 3. USE NAVIGATE (Instant Transition)
                    navigate(`${baseRole}/messages?userId=${msg.message.sender_id}`);
                }}
            >
              <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
                      {msg.message?.sender_picture ? (
                        <img src={msg.message.sender_picture} className="w-full h-full object-cover" alt="Avatar"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                            {(msg.message?.sender_name || "U").charAt(0)}
                        </div>
                      )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">
                    {msg.message?.sender_name || "New Message"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {msg.message?.content}
                </p>
              </div>
            </div>
        ), { 
            duration: 5000, 
            position: "top-right",
            className: "bg-white shadow-xl rounded-2xl p-4 border border-slate-100 ring-1 ring-black/5" 
        });
    } 
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