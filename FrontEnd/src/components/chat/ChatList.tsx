import React, { useState, useEffect } from "react";
import { Search, MessageSquarePlus, User } from "lucide-react";
import messagesAPI, { type Conversation, type UserSearchResult } from "@/services/messages";

interface ChatListProps {
  conversations: Conversation[];
  activeChat: Conversation | null;
  onSelectChat: (chat: Conversation) => void;
  onStartNewChat: (user: UserSearchResult) => void;
  typingUsers?: Set<number>; // 🆕 New Prop
}

const ChatList: React.FC<ChatListProps> = ({ conversations, activeChat, onSelectChat, onStartNewChat, typingUsers }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  // Search Logic (Debounced)
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
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 🕒 Smart Time Formatter (Industrial Standard)
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    
    // If today, show time (9:41 AM)
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show 'Yesterday'
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    // Otherwise show date (Jan 15)
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-l-2xl">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Messages</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search people..." 
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {/* SEARCH RESULTS */}
        {searchTerm.trim().length > 0 && (
          <div className="mb-2">
            <p className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">Search Results</p>
            {searchResults.length === 0 ? (
               <p className="px-5 py-4 text-sm text-slate-500 italic">No user found</p>
            ) : (
               searchResults.map(result => (
                  <div 
                    key={result.id}
                    onClick={() => { onStartNewChat(result); setSearchTerm(""); setSearchResults([]); }}
                    className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors"
                  >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {result.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{result.name}</p>
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
        {conversations.length === 0 && !searchTerm ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center h-64">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-sm font-medium">No conversations yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {conversations.map((chat) => {
              const isTyping = typingUsers?.has(chat.user_id);
              
              return (
                <div 
                  key={chat.user_id}
                  onClick={() => onSelectChat(chat)}
                  className={`p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 ${
                      activeChat?.user_id === chat.user_id 
                      ? 'bg-purple-50 border-r-4 border-purple-500' 
                      : 'hover:bg-slate-50 border-r-4 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-slate-100 overflow-hidden shadow-sm">
                      {chat.picture ? (
                        <img src={chat.picture} alt={chat.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold text-lg">
                          {chat.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {/* Status Dot (Optional) */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-sm font-bold truncate ${activeChat?.user_id === chat.user_id ? 'text-purple-900' : 'text-slate-900'}`}>
                        {chat.name}
                      </h3>
                      {chat.last_message_time && (
                        <span className={`text-[10px] whitespace-nowrap ml-2 ${chat.unread_count > 0 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                          {formatTime(chat.last_message_time)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center h-5">
                      {isTyping ? (
                          // 🟢 TYPING ANIMATION
                          <div className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></span>
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                              <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                              <span className="text-xs text-purple-500 ml-1 font-medium">Typing...</span>
                          </div>
                      ) : (
                          <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                            {chat.last_message || <span className="italic opacity-70">Start a conversation</span>}
                          </p>
                      )}
                      
                      {chat.unread_count > 0 && (
                        <span className="ml-2 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm shadow-purple-200">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;