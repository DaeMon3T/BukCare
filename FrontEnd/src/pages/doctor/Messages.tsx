import React, { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video, User, ArrowLeft, MessageSquarePlus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI from "@/services/messages";
import type { Conversation, Message, UserSearchResult } from "@/services/messages";

import toast from "react-hot-toast";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]); 
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations
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

  // 2. Search Logic (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        try {
          const results = await messagesAPI.searchUsers(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error("Search failed", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // Wait 300ms after typing stops

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 3. Start Chat with New User
  const startNewChat = (userResult: UserSearchResult) => {
    // Check if we already have a conversation with this person
    const existingConv = conversations.find(c => c.user_id === userResult.id);
    
    if (existingConv) {
      setActiveChat(existingConv);
    } else {
      // Create a temporary conversation object
      const tempConv: Conversation = {
        user_id: userResult.id,
        name: userResult.name,
        role: userResult.role,
        picture: userResult.picture,
        unread_count: 0,
        last_message: "",
        last_message_time: new Date().toISOString(),
        // Fallback for unread_count if strictly typed in interface
        ...({} as any) 
      };
      setActiveChat(tempConv);
    }
    setSearchTerm(""); // Clear search
    setSearchResults([]);
    setIsMobileChatOpen(true);
  };

  // 4. Load Messages
  useEffect(() => {
    if (activeChat) {
      loadChatHistory(activeChat.user_id);
      // Mark local unread as 0
      setConversations(prev => 
        prev.map(c => c.user_id === activeChat.user_id ? { ...c, unread_count: 0 } : c)
      );
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

  // 5. WebSocket Listener
  useEffect(() => {
    if (!lastMessage || lastMessage.type !== "CHAT_MESSAGE") return;

    const incomingMsg = lastMessage.message;
    // ✅ FIX: Explicitly cast ID to number to avoid type errors
    const currentUserId = Number(user?.id) || 0; 

    // A. Update Chat Window
    if (activeChat && (incomingMsg.sender_id === activeChat.user_id || incomingMsg.receiver_id === activeChat.user_id)) {
      setMessages(prev => [...prev, incomingMsg]);
      scrollToBottom();
    }

    // B. Update Sidebar List
    setConversations(prev => {
      const otherUserId = incomingMsg.sender_id === currentUserId ? incomingMsg.receiver_id : incomingMsg.sender_id;
      const exists = prev.find(c => c.user_id === otherUserId);
      
      if (exists) {
        // Update existing item
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
        // If it's a new message from someone NOT in list, reload to get their details
        loadConversations(); 
        return prev;
      }
    });

  }, [lastMessage, activeChat, user]);

  // 6. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempContent = newMessage;
    setNewMessage(""); 

    // ✅ FIX: Explicitly cast ID to number
    const senderId = Number(user?.id) || 0;

    try {
      // Optimistic UI
      const optimisticMsg: Message = {
        id: Date.now(),
        sender_id: senderId,
        receiver_id: activeChat.user_id,
        content: tempContent,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      // API Call
      await messagesAPI.sendMessage(activeChat.user_id, tempContent);
      
      // If this was a "New Chat" (not in list yet), force reload to get proper data
      const inList = conversations.find(c => c.user_id === activeChat.user_id);
      if (!inList) {
         setTimeout(() => loadConversations(), 500); 
      } else {
         // Update existing list preview locally
         setConversations(prev => prev.map(c => 
            c.user_id === activeChat.user_id 
              ? { ...c, last_message: tempContent, last_message_time: new Date().toISOString() } 
              : c
          ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime()));
      }

    } catch (error) {
      console.error("Failed to send", error);
      toast.error("Failed to send message");
    }
  };

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
                placeholder="Search people..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            
            {/* SEARCH RESULTS MODE */}
            {searchTerm.trim().length > 0 && (
              <div className="mb-4">
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results</p>
                {searchResults.length === 0 ? (
                   <p className="px-4 text-sm text-slate-500 italic">No user found</p>
                ) : (
                   searchResults.map(result => (
                      <div 
                        key={result.id}
                        onClick={() => startNewChat(result)}
                        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {result.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-slate-900">{result.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{result.role}</p>
                         </div>
                         <MessageSquarePlus className="w-4 h-4 text-blue-400 ml-auto" />
                      </div>
                   ))
                )}
                <div className="border-b border-slate-100 my-2"></div>
              </div>
            )}

            {/* NORMAL CONVERSATION LIST */}
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : conversations.length === 0 && !searchTerm ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                 <User className="w-12 h-12 mb-2 text-slate-200" />
                 <p>No conversations yet.</p>
                 <p className="text-xs mt-1">Search for a user to start chatting.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {conversations.map((chat) => (
                  <div 
                    key={chat.user_id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${activeChat?.user_id === chat.user_id ? 'bg-purple-50 hover:bg-purple-50' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                        {chat.picture ? (
                          <img src={chat.picture} alt={chat.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-lg">
                            {chat.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-semibold truncate ${activeChat?.user_id === chat.user_id ? 'text-purple-900' : 'text-slate-900'}`}>
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
                          {chat.last_message || "Draft"}
                        </p>
                        {chat.unread_count > 0 && (
                          <span className="ml-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
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
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden p-2 -ml-2 text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    {activeChat.picture ? (
                      <img src={activeChat.picture} alt={activeChat.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold">
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

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === Number(user?.id);
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                          isMe 
                            ? 'bg-purple-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                        }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
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
              <p className="text-sm">Search for a user to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;