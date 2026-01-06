import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

// 1. Define the Shape
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any; 
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Use your specific backend URL here
    const wsUrl = `ws://localhost:8000/v1/notifications/ws/${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("🟢 Connected to Real-Time Server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        console.log("New Signal:", rawData);
        
        // FIX: Attach a local timestamp when the message actually arrives
        const messageWithTimestamp = {
            ...rawData,
            _receivedAt: Date.now() // Internal timestamp
        };
        
        setLastMessage(messageWithTimestamp);
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("🔴 Disconnected");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socketRef.current = ws;

    return () => {
      if (ws.readyState === 1) ws.close();
    };
  }, [user]);

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