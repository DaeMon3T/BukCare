import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useWebSocket } from "./WebSocketContext";
import { PhoneOff, Video } from "lucide-react";
import { useAuth } from "./AuthContext";

interface CallContextType {
  isRinging: boolean;
  caller: string;
  roomId: string | null;
  acceptCall: () => void;
  rejectCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { lastMessage } = useWebSocket();
  const { user } = useAuth();
  
  const [isRinging, setIsRinging] = useState(false);
  const [caller, setCaller] = useState("Unknown Caller");
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Listen for Incoming Call Signals
  useEffect(() => {
    if (!lastMessage) return;

    // Detect Chat Message containing the Invite Link
    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const msg = lastMessage.message;
      const content = msg.content || "";
      
      // Check if it is a video call invite
      if (content.includes("📞 Started a Video Call. Join here:")) {
        const senderId = msg.sender_id;
        const currentUserId = Number(user?.id);

        // ONLY ring if I am the receiver (don't ring for myself)
        if (senderId !== currentUserId) {
            const extractedRoomId = content.split("Join here:")[1]?.trim();
            const senderName = msg.sender_name || "Doctor"; // Backend usually sends sender_name join

            if (extractedRoomId) {
                startRinging(senderName, extractedRoomId);
            }
        }
      }
    }
  }, [lastMessage, user]);

  const startRinging = (callerName: string, room: string) => {
    setCaller(callerName);
    setRoomId(room);
    setIsRinging(true);
    
    // Play Sound Loop
    if (!audioRef.current) {
        audioRef.current = new Audio("/mp3/ringtone.mp3"); // Ensure this file exists in /public
        audioRef.current.loop = true;
    }
    audioRef.current.play().catch(e => console.error("Audio play failed (interaction needed)", e));
  };

  const stopRinging = () => {
    setIsRinging(false);
    setRoomId(null);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  const acceptCall = () => {
    stopRinging();
    if (roomId) {
        window.open(`https://meet.jit.si/${roomId}`, "_blank");
    }
  };

  const rejectCall = () => {
    stopRinging();
    // Optional: You could send a "Call Rejected" message back via API here
  };

  return (
    <CallContext.Provider value={{ isRinging, caller, roomId, acceptCall, rejectCall }}>
      {children}
      
      {/* 🔔 GLOBAL INCOMING CALL OVERLAY */}
      {isRinging && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center w-80 md:w-96 text-center">
                
                {/* Pulsating Avatar */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 overflow-hidden">
                        <UserIcon className="w-12 h-12 text-slate-400" />
                        {/* If you have caller picture, render <img /> here */}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1">{caller}</h3>
                <p className="text-blue-400 font-medium mb-8 animate-pulse">Incoming Video Call...</p>

                <div className="flex items-center gap-8">
                    {/* Reject Button */}
                    <button 
                        onClick={rejectCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-14 h-14 bg-red-500/20 group-hover:bg-red-500 rounded-full flex items-center justify-center transition-all border border-red-500">
                            <PhoneOff className="w-6 h-6 text-red-500 group-hover:text-white" />
                        </div>
                        <span className="text-xs text-slate-400 group-hover:text-red-400 font-medium">Decline</span>
                    </button>

                    {/* Accept Button */}
                    <button 
                        onClick={acceptCall}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 bg-green-500 group-hover:bg-green-400 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] animate-bounce-slow">
                            <Video className="w-8 h-8 text-white fill-current" />
                        </div>
                        <span className="text-xs text-green-400 font-bold">Accept</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </CallContext.Provider>
  );
};

// Helper Component for Avatar
const UserIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};