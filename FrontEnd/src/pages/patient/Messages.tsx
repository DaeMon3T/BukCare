import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation } from "@/services/messages";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare } from "lucide-react";

// 🗑️ Removed: notificationSound import

const PatientMessages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // 🗑️ Removed: audioRef

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

  // 🗑️ Removed: playNotification function

  // WEBSOCKET LISTENER 
  useEffect(() => {
    if (!lastMessage) return;

    // HANDLE INCOMING TEXT
    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const incomingMsg = lastMessage.message;
      const currentUserId = Number(user?.id);
      const senderId = incomingMsg.sender_id;
      const isActiveChat = activeChat?.user_id === senderId;

      // 🗑️ Removed: Play Sound Logic (Handled globally now)

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

  }, [lastMessage, activeChat, user]); // 🗑️ Removed: playNotification from dependency array

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
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden">
      <Navbar />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 gap-6 h-[calc(100vh-80px)]">
        
        {/* SIDEBAR */}
        <div className={`w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col transition-all duration-300 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
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

        {/* CHAT WINDOW */}
        <div className={`flex-1 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <ChatWindow 
              activeChat={activeChat}
              onBack={() => setIsMobileChatOpen(false)}
              onMessageSent={handleMessageSent}
              isTyping={typingUsers.has(activeChat.user_id)} 
            />
          ) : (
            // Empty State
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                <MessageSquare className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Your Messages</h3>
              <p className="text-sm text-slate-500 mt-2">Select a conversation to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientMessages;