import React, { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video, User, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI from "@/services/messages";
import type { Conversation, Message } from "@/services/messages";
import toast from "react-hot-toast";

const PatientMessages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations on Mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load conversations", error);
      setLoading(false);
    }
  };

  // 2. Fetch Messages when Active Chat Changes
  useEffect(() => {
    if (activeChat) {
      loadChatHistory(activeChat.user_id);
      // Mark as read in UI instantly
      setConversations(prev => 
        prev.map(c => c.user_id === activeChat.user_id ? { ...c, unread_count: 0 } : c)
      );
      setIsMobileChatOpen(true);
    }
  }, [activeChat]);

  const loadChatHistory = async (userId: number) => {
    try {
      const history = await messagesAPI.getChatHistory(userId);
      setMessages(history);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 3. WEBSOCKET LISTENER
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "CHAT_MESSAGE") return;

    const incomingMsg = lastMessage.message;
    const currentUserId = Number(user?.id) || 0;

    // A. Append to chat if open
    if (activeChat && (incomingMsg.sender_id === activeChat.user_id || incomingMsg.receiver_id === activeChat.user_id)) {
      setMessages(prev => [...prev, incomingMsg]);
      scrollToBottom();
    }

    // B. Update List Preview
    setConversations(prev => {
      const otherUserId = incomingMsg.sender_id === currentUserId ? incomingMsg.receiver_id : incomingMsg.sender_id;
      const exists = prev.find(c => c.user_id === otherUserId);
      
      if (exists) {
        return prev.map(c => {
          if (c.user_id === otherUserId) {
            return {
              ...c,
              last_message: incomingMsg.content,
              last_message_time: incomingMsg.timestamp,
              unread_count: (activeChat?.user_id === otherUserId) ? 0 : c.unread_count + 1
            };
          }
          return c;
        }).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime());
      } else {
        loadConversations(); // New conversation started
        return prev;
      }
    });

  }, [lastMessage, activeChat, user]);

  // 4. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempContent = newMessage;
    setNewMessage(""); 

    try {
      // Optimistic UI
      const optimisticMsg: Message = {
        id: Date.now(),
        sender_id: Number(user?.id) || 0,
        receiver_id: activeChat.user_id,
        content: tempContent,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      // API Call
      await messagesAPI.sendMessage(activeChat.user_id, tempContent);
      
      // Update Sidebar
      setConversations(prev => prev.map(c => 
        c.user_id === activeChat.user_id 
          ? { ...c, last_message: tempContent, last_message_time: new Date().toISOString() } 
          : c
      ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime()));

    } catch (error) {
      console.error("Failed to send", error);
      toast.error("Failed to send message");
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto p-4 gap-4 h-[calc(100vh-80px)]">
        
        {/* LEFT: Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search doctors..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No conversations yet</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredConversations.map((chat) => (
                  <div 
                    key={chat.user_id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${activeChat?.user_id === chat.user_id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                        {chat.picture ? (
                          <img src={chat.picture} alt={chat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                            {chat.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate ${activeChat?.user_id === chat.user_id ? 'text-blue-900' : 'text-slate-900'}`}>
                          {chat.name}
                        </h3>
                        {chat.last_message_time && (
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                            {formatTime(chat.last_message_time)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm truncate ${chat.unread_count > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                          {chat.last_message || "Start chatting"}
                        </p>
                        {chat.unread_count > 0 && (
                          <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Chat Window */}
        <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden p-2 -ml-2 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    {activeChat.picture ? (
                      <img src={activeChat.picture} alt={activeChat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">
                        {activeChat.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{activeChat.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{activeChat.role}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><Phone className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><Video className="w-5 h-5" /></button>
                  <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === Number(user?.id);
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                        }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Start chatting with your doctor</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientMessages;