import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation } from "@/services/messages";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { User } from "lucide-react";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // 1. Fetch Conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations", error);
    }
  };

  // 2. WebSocket Listener (Global Updates)
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const incomingMsg = lastMessage.message;
      const currentUserId = Number(user?.id);
      const senderId = incomingMsg.sender_id;
      const receiverId = incomingMsg.receiver_id;
      const otherUserId = senderId === currentUserId ? receiverId : senderId;

      // Update Conversation List Preview
      setConversations(prev => {
        const exists = prev.find(c => c.user_id === otherUserId);
        
        // Helper to format preview text
        let preview = incomingMsg.content;
        if (incomingMsg.message_type === "appointment_reminder") preview = "📅 Appointment Reminder";
        if (incomingMsg.content.includes("📞 Started a Video Call")) preview = "📞 Video Call";

        if (exists) {
          return prev.map(c => 
            c.user_id === otherUserId 
              ? { 
                  ...c, 
                  last_message: preview, 
                  last_message_time: incomingMsg.timestamp, 
                  unread_count: (activeChat?.user_id === otherUserId) ? 0 : c.unread_count + 1 
                } 
              : c
          ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime());
        } else {
          loadConversations(); // New user started chatting
          return prev;
        }
      });
    }
  }, [lastMessage, activeChat, user]);

  // 3. Handlers
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
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 gap-4 h-[calc(100vh-80px)]">
        
        {/* SIDEBAR */}
        <div className={`w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <ChatList 
            conversations={conversations}
            activeChat={activeChat}
            onSelectChat={(chat) => { setActiveChat(chat); setIsMobileChatOpen(true); }}
            onStartNewChat={handleStartNewChat}
          />
        </div>

        {/* CHAT WINDOW */}
        <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <ChatWindow 
              activeChat={activeChat}
              onBack={() => setIsMobileChatOpen(false)}
              onMessageSent={handleMessageSent}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Search for a user to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;