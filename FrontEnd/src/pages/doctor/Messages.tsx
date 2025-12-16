import React, { useState, useEffect, useRef } from "react";
import { Send, Search, MoreVertical, Phone, Video, User, ArrowLeft, MessageSquarePlus, Trash2, Reply, Forward } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import toast from "react-hot-toast";

// FIX 1: Import the service (default export) normally
import messagesAPI from "@/services/messages"; 

// FIX 2: Import the types separately using 'import type'
import type { Conversation, Message, UserSearchResult } from "@/services/messages";

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
  
  // State for message options menu
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

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
      // FIX: Ensure picture is a string (default to empty string if undefined)
      const tempConv: Conversation = {
        user_id: userResult.id,
        name: userResult.name,
        role: userResult.role,
        picture: userResult.picture || "", 
        unread_count: 0,
        last_message: "",
        last_message_time: new Date().toISOString() 
      } as Conversation; 
      
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

  // 5. WebSocket Listener (FIXED FOR DUPLICATES)
  useEffect(() => {
    if (!lastMessage) return;

    // HANDLE DELETION
    if (lastMessage.type === "MESSAGE_DELETED") {
        setMessages(prev => prev.map(m => 
            m.id === lastMessage.message_id 
                ? { ...m, content: "Message unsent", is_read: true } // Mark as deleted logic if needed, or filter out
                : m
        ).filter(m => m.id !== lastMessage.message_id)); // OR just remove it completely:
        // Note: Choose one strategy. If you want "Message unsent" text, keep map. If you want it gone, use filter.
        // Let's use filter to completely remove for now as per previous request context, or update content.
        // Actually, let's just filter it out for cleaner UI unless 'is_deleted' flag exists.
        // If the backend sends 'is_deleted', we could show it.
        // For now, let's assume we remove it from the view:
         setMessages(prev => prev.filter(m => m.id !== lastMessage.message_id));
    }

    if (lastMessage.type !== "CHAT_MESSAGE") return;

    const incomingMsg = lastMessage.message;
    // Fix type mismatch: Auth ID is string | number, Message ID is number
    const currentUserId = Number(user?.id) || 0;

    // Logic: If I am sender, other is receiver. If I am receiver, other is sender.
    const senderId = incomingMsg.sender_id;
    const receiverId = incomingMsg.receiver_id;

    const isRelevantToActiveChat = activeChat && (
        (senderId === activeChat.user_id && receiverId === currentUserId) || 
        (senderId === currentUserId && receiverId === activeChat.user_id)
    );

    // A. Update Chat Window
    if (isRelevantToActiveChat) {
      setMessages(prev => {
        // 1. Check if we already have this exact message ID (from a previous socket event)
        if (prev.some(m => m.id === incomingMsg.id)) return prev;

        // 2. OPTIMISTIC REPLACEMENT (The Fix)
        // If *I* sent this message, find the temporary one I created earlier
        if (senderId === currentUserId) {
           // Look for a message with same content and a huge temporary ID (timestamp)
           // created in the last 10 seconds
           const tempIndex = prev.findIndex(m => 
              m.content === incomingMsg.content && 
              m.id > 1000000000000 && // Temp IDs are big timestamps
              m.sender_id === currentUserId
           );

           if (tempIndex !== -1) {
              // REPLACE the temp message with the real one
              const newMessages = [...prev];
              newMessages[tempIndex] = incomingMsg;
              return newMessages;
           }
        }

        // If no match found, append normally
        return [...prev, incomingMsg];
      });
      scrollToBottom();
    }

    // B. Update Sidebar List
    setConversations(prev => {
      const otherUserId = senderId === currentUserId ? receiverId : senderId;
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
        // Reload list to get new user details
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

    const currentUserId = Number(user?.id) || 0;

    try {
      // Optimistic UI
      const optimisticMsg: Message = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: activeChat.user_id,
        content: tempContent,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();

      // API Call
      await messagesAPI.sendMessage(activeChat.user_id, tempContent);
      
      // Update Sidebar Preview
      setConversations(prev => {
        const exists = prev.find(c => c.user_id === activeChat.user_id);
        if(exists) {
             return prev.map(c => 
                c.user_id === activeChat.user_id 
                  ? { ...c, last_message: tempContent, last_message_time: new Date().toISOString() } 
                  : c
              ).sort((a, b) => new Date(b.last_message_time!).getTime() - new Date(a.last_message_time!).getTime());
        } else {
            setTimeout(() => loadConversations(), 500);
            return prev;
        }
      });

    } catch (error) {
      console.error("Failed to send", error);
      toast.error("Failed to send message");
    }
  };

  const handleDeleteMessage = async (msgId: number) => {
    // Optimistic remove
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setActiveMessageId(null); // Close menu
    
    try {
        await messagesAPI.deleteMessage(msgId);
    } catch (error) {
        console.error("Failed to delete", error);
        toast.error("Failed to delete message");
        // Revert would require re-fetching or keeping a copy, simplified here
    }
  };

  const handleTouchStart = (id: number) => {
    const timer = setTimeout(() => {
        setActiveMessageId(id);
        // Vibrate for feedback on mobile if supported
        if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (activeMessageId !== null && !(event.target as Element).closest('.message-options-menu')) {
            setActiveMessageId(null);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMessageId]);

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
            {/* SEARCH RESULTS */}
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

            {/* CONVERSATION LIST */}
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

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === (Number(user?.id) || 0);
                  
                  return (
                    <div 
                        key={idx} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}
                        onMouseLeave={() => setActiveMessageId(null)} // Hide menu on mouse leave
                    >
                      
                      {/* MESSAGE OPTIONS (3 Vertical Dots or Long Press Menu) */}
                      {isMe && (
                        <div className="relative flex items-center">
                           {/* Trigger Button (Visible on Hover / Long Press Active) */}
                           <button 
                              className={`p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeMessageId === msg.id ? 'opacity-100' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMessageId(activeMessageId === msg.id ? null : msg.id);
                              }}
                           >
                              <MoreVertical className="w-4 h-4" />
                           </button>

                           {/* Popup Menu */}
                           {activeMessageId === msg.id && (
                              <div className="message-options-menu absolute bottom-8 right-0 bg-white shadow-xl border border-slate-100 rounded-lg py-1 w-32 z-10 animate-in fade-in zoom-in-95 duration-200">
                                 <button 
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                 >
                                    <Trash2 className="w-3 h-3" /> Delete
                                 </button>
                                 <button 
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 opacity-50 cursor-not-allowed"
                                    title="Coming soon"
                                 >
                                    <Reply className="w-3 h-3" /> Reply
                                 </button>
                                 <button 
                                    className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 opacity-50 cursor-not-allowed"
                                    title="Coming soon"
                                 >
                                    <Forward className="w-3 h-3" /> Forward
                                 </button>
                              </div>
                           )}
                        </div>
                      )}

                      <div 
                        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative ${
                          isMe 
                            ? 'bg-purple-600 text-white rounded-br-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                        }`}
                        // Long Press Handlers
                        onTouchStart={() => handleTouchStart(msg.id)}
                        onTouchEnd={handleTouchEnd}
                        // Disable default context menu on long press
                        onContextMenu={(e) => e.preventDefault()} 
                      >
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