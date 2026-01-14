import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation } from "@/services/messages";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare, Sparkles } from "lucide-react";

const PatientMessages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // Fetch Conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
      );
      setConversations(sorted);
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  };

  // WEBSOCKET LISTENER 
  useEffect(() => {
    if (!lastMessage) return;

    // HANDLE INCOMING TEXT
    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const incomingMsg = lastMessage.message;
      const currentUserId = Number(user?.id);
      const senderId = incomingMsg.sender_id;
      const isActiveChat = activeChat?.user_id === senderId;

      setConversations(prev => {
        const exists = prev.find(c => c.user_id === senderId || c.user_id === incomingMsg.receiver_id);
        const otherUserId = senderId === currentUserId ? incomingMsg.receiver_id : senderId;

        let preview = incomingMsg.content;
        if (incomingMsg.message_type === "appointment_reminder") preview = "Appointment Reminder";
        if (incomingMsg.content.includes("video_call")) preview = "📞 Video Call";

        if (exists) {
          return prev.map(c => 
            c.user_id === otherUserId 
              ? { 
                  ...c, 
                  last_message: preview, 
                  last_message_time: incomingMsg.timestamp, 
                  // Don't increment unread count if we are looking at it!
                  unread_count: isActiveChat ? 0 : (c.unread_count || 0) + 1 
                } 
              : c
          ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime());
        } else {
          loadConversations(); 
          return prev;
        }
      });
    }

    // HANDLE TYPING INDICATORS
    if (lastMessage.type === "TYPING_START" && lastMessage.sender_id) {
       const senderId = lastMessage.sender_id;
       setTypingUsers(prev => new Set(prev).add(senderId));
    }
    
    if (lastMessage.type === "TYPING_STOP" && lastMessage.sender_id) {
       const senderId = lastMessage.sender_id;
       setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(senderId);
          return next;
       });
    }

  }, [lastMessage, activeChat, user]);

  // Handlers
  const handleStartNewChat = (userResult: any) => {
    const existing = conversations.find(c => c.user_id === userResult.id);
    if (existing) {
      setActiveChat(existing);
    } else {
      setActiveChat({
        user_id: userResult.id,
        name: userResult.name,
        role: userResult.role,
        unread_count: 0,
        last_message: "",
        last_message_time: new Date().toISOString(),
        picture: userResult.picture
      } as Conversation);
    }
    setIsMobileChatOpen(true);
  };

  const handleMessageSent = (text: string) => {
    if (!activeChat) return;
    setConversations(prev => prev.map(c => 
      c.user_id === activeChat.user_id 
        ? { ...c, last_message: text, last_message_time: new Date().toISOString() } 
        : c
    ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime()));
  };

  return (
    // ✨ GLASSMORPHISM BACKGROUND WRAPPER
    <div className="h-screen flex flex-col bg-[#F0F4F8] relative overflow-hidden font-sans text-slate-800">
      
      {/* 🎨 AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 md:p-6 gap-6 h-[calc(100vh-80px)]">
            
            {/* SIDEBAR (Glass Panel) */}
            <div className={`w-full md:w-80 lg:w-96 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white/50 flex flex-col transition-all duration-300 overflow-hidden ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
            <ChatList 
                conversations={conversations}
                activeChat={activeChat}
                onSelectChat={(chat) => { 
                    setActiveChat(chat); 
                    setIsMobileChatOpen(true); 
                    setConversations(prev => prev.map(c => c.user_id === chat.user_id ? {...c, unread_count: 0} : c));
                }}
                onStartNewChat={handleStartNewChat}
                typingUsers={typingUsers} 
            />
            </div>

            {/* CHAT WINDOW (Glass Panel) */}
            <div className={`flex-1 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white/50 flex flex-col overflow-hidden transition-all duration-300 relative ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
            {activeChat ? (
                <ChatWindow 
                activeChat={activeChat}
                onBack={() => setIsMobileChatOpen(false)}
                onMessageSent={handleMessageSent}
                isTyping={typingUsers.has(activeChat.user_id)} 
                />
            ) : (
                // Empty State (Styled)
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
                    {/* Subtle background decoration inside the empty state */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/40 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center p-8 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-100 animate-pulse-slow ring-4 ring-white/50">
                            <MessageSquare className="w-10 h-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                            Your Messages <Sparkles className="w-5 h-5 text-amber-400" />
                        </h3>
                        <p className="text-slate-500 max-w-xs leading-relaxed">
                            Select a conversation from the sidebar or start a new chat to connect with your doctors.
                        </p>
                    </div>
                </div>
            )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default PatientMessages;