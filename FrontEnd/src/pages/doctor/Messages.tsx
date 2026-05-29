import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation } from "@/services/messages";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { MessageSquare, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

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

  useEffect(() => {
      const targetUserId = searchParams.get("userId");
      
      // Only run if we have a target ID and conversations are loaded
      if (targetUserId && conversations.length > 0) {
          const targetIdNum = Number(targetUserId);
          
          // Find the chat in the loaded list
          const targetChat = conversations.find(c => c.user_id === targetIdNum);
          
          if (targetChat) {
              if (activeChat?.user_id !== targetChat.user_id) {
                  setActiveChat(targetChat);
                  setIsMobileChatOpen(true); 
              }
          }
      }
  }, [searchParams, conversations, activeChat]);


  // WEBSOCKET LISTENER 
  useEffect(() => {
    if (!lastMessage) return;

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
    <div className="h-screen flex flex-col bg-[#F8FAFC] relative overflow-hidden font-sans text-slate-800">
      
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Navbar />

        <div className="flex-1 flex max-w-[1920px] w-full mx-auto p-0 md:p-6 md:gap-6 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] relative">
            
            {/* --- SIDEBAR (CHAT LIST) --- */}
            <div 
                className={`
                    ${isMobileChatOpen ? 'hidden md:block' : 'block'}
                    relative z-20
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isSidebarOpen 
                        ? 'w-full md:w-80 lg:w-96 opacity-100 translate-x-0' 
                        : 'w-0 opacity-0 -translate-x-4 pointer-events-none overflow-hidden md:w-0'
                    }
                `}
            >
                {/* CLOSE BUTTON */}
                <div className="hidden md:block absolute top-4 right-4 z-50">
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 p-1.5 rounded-lg transition-colors"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                <div data-tour="messages-list" className="h-full w-full md:w-80 lg:w-96 min-w-[20rem] bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden">
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
            </div>

            {/* --- CHAT WINDOW (MAIN CONTENT) --- */}
            <div className={`flex-1 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 relative ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
                
                {/* OPEN BUTTON */}
                {!isSidebarOpen && (
                    <div className="hidden md:block absolute top-20 left-0 z-50">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="bg-white border border-l-0 border-slate-200 text-slate-500 hover:text-blue-600 p-2 rounded-r-xl shadow-md hover:pl-3 transition-all"
                            title="Open sidebar"
                        >
                            <PanelLeftOpen className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {activeChat ? (
                    <ChatWindow 
                        activeChat={activeChat}
                        onBack={() => setIsMobileChatOpen(false)}
                        onMessageSent={handleMessageSent}
                        isTyping={typingUsers.has(activeChat.user_id)} 
                    />
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-white/40 pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center p-8 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-slate-200 ring-8 ring-white/60">
                                <MessageSquare className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-700 mb-2 flex items-center gap-2">
                                Doctor Messages <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                            </h3>
                            <p className="text-slate-500 max-w-xs leading-relaxed font-medium">
                                Select a conversation from the sidebar or start a new chat with a patient.
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

export default Messages;