import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";

// 1. Define the Shape of the Context
interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any; // Using 'any' for flexibility with different notification types
}

// 2. Create the Context
const WebSocketContext = createContext<WebSocketContextType | null>(null);

// 3. Create the Provider
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Only connect if user is logged in with a valid ID
    if (!user?.id) return;

    // Connect to Backend WebSocket
    const wsUrl = `ws://localhost:8000/v1/ws?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("🟢 Connected to BukCare Real-Time Server");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 New Notification:", data);
        setLastMessage(data);
      } catch (err) {
        console.error("Failed to parse WebSocket message", err);
      }
    };

    ws.onclose = () => {
      console.log("🔴 Disconnected from Server");
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    socketRef.current = ws;

    // Cleanup: Close connection when user logs out or component unmounts
    return () => {
      if (ws.readyState === 1) { // 1 = OPEN
        ws.close();
      }
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// 4. Create the Hook (With Safety Check)
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    // This ensures TypeScript knows 'context' is never null when used properly
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  
  return context;
};