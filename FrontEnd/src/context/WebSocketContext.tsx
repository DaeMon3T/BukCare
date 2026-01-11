import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast"; 

interface WebSocketMessage {
  type: string;
  payload?: any;
  message?: any; 
  notification?: any; 
  _receivedAt?: number;
  appointment_id?: number;
  status?: string;
  new_date?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // This extracts ONLY the domain:port, ignoring any /v1 paths in your .env
  const getSocketUrl = (userId: string | number) => {
    let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    
    // Ensure it starts with http for the URL parser to work
    if (!baseUrl.startsWith("http")) {
        baseUrl = `http://${baseUrl}`;
    }

    try {
        const urlObj = new URL(baseUrl);
        const wsProtocol = urlObj.protocol === "https:" ? "wss" : "ws";
        const host = urlObj.host; 
        
        return `${wsProtocol}://${host}/v1/notifications/ws/${userId}`;
    } catch (error) {
        console.error("Invalid API URL:", baseUrl);
        return `ws://localhost:8000/v1/notifications/ws/${userId}`;
    }
  };

  // Connection Logic
  const connect = useCallback(() => {
    if (!user?.id) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return; 

    const url = getSocketUrl(user.id);
    console.log("Connecting to WS:", url);
    
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("🟢 WS Connected");
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
      console.log("🔴 WS Disconnected");
      setIsConnected(false);
      socketRef.current = null;

      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting Reconnect...");
          connect();
        }, 3000); 
      }
    };

    ws.onerror = (error) => {
      console.error("WS Error:", error);
      ws.close(); 
    };

    socketRef.current = ws;
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, connect]);

  const handleGlobalToast = (msg: any) => {
    if (msg.type === "NEW_APPOINTMENT") {
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
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error("useWebSocket must be used within a WebSocketProvider");
  return context;
};