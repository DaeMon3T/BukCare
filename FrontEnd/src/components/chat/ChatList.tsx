import React, { useState, useEffect } from "react";
import { Search, MessageSquarePlus, User } from "lucide-react";
import messagesAPI, { type Conversation, type UserSearchResult } from "@/services/messages";

interface ChatListProps {
  conversations: Conversation[];
  activeChat: Conversation | null;
  onSelectChat: (chat: Conversation) => void;
  onStartNewChat: (user: UserSearchResult) => void;
}

const ChatList: React.FC<ChatListProps> = ({ conversations, activeChat, onSelectChat, onStartNewChat }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  // Search Logic
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

  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header & Search */}
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
                    onClick={() => { onStartNewChat(result); setSearchTerm(""); setSearchResults([]); }}
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
        {conversations.length === 0 && !searchTerm ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center">
             <User className="w-12 h-12 mb-2 text-slate-200" />
             <p>No conversations yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {conversations.map((chat) => (
              <div 
                key={chat.user_id}
                onClick={() => onSelectChat(chat)}
                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${activeChat?.user_id === chat.user_id ? 'bg-purple-50 hover:bg-purple-50' : ''}`}
              >
                <div className="relative shrink-0">
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
  );
};

export default ChatList;