import React, { useState, useEffect, useRef } from "react";
import { Send, MoreVertical, Video as VideoIcon, ArrowLeft, Trash2, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation } from "@/services/messages";
import api from "@/services/api";
import toast from "react-hot-toast";
import AppointmentSelectorModal from "./AppointmentSelectorModal";

interface ChatWindowProps {
  activeChat: Conversation;
  onBack: () => void;
  onMessageSent: (text: string) => void;
  isTyping?: boolean; 
}

const ChatWindow: React.FC<ChatWindowProps> = ({ activeChat, onBack, onMessageSent, isTyping }) => {
  const { user } = useAuth();
  const { lastMessage, markAsReadGlobally } = useWebSocket();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // CONSISTENT TIME FORMATTER
  const formatMessageTime = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      // This ensures 10:30 AM format consistently
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    loadChatHistory();
    markChatAsRead(); 
  }, [activeChat.user_id]); // <--- THIS WAS THE KEY FIX!

  const loadChatHistory = async () => {
    try {
      const history = await messagesAPI.getChatHistory(activeChat.user_id);
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const markChatAsRead = async () => {
      try {
          await messagesAPI.markAsRead(activeChat.user_id);
          if (markAsReadGlobally) markAsReadGlobally();
      } catch (error) {
          console.error("Failed to mark read", error);
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "MESSAGE_DELETED") {
      setMessages(prev => prev.map(m => m.id === lastMessage.message ? { ...m, content: "Message unsent" } : m));
    }

    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const incomingMsg = lastMessage.message;
      const currentUserId = Number(user?.id);
      
      if ((incomingMsg.sender_id === activeChat.user_id) || (incomingMsg.sender_id === currentUserId && incomingMsg.receiver_id === activeChat.user_id)) {
         setMessages(prev => {
            if (prev.some(m => m.id === incomingMsg.id)) return prev;
            
            if (incomingMsg.sender_id === currentUserId) {
               const tempIndex = prev.findIndex(m => m.id > 1000000000000 && m.sender_id === currentUserId);
               if (tempIndex !== -1) {
                  const newMsgs = [...prev];
                  newMsgs[tempIndex] = incomingMsg;
                  return newMsgs;
               }
            }
            return [...prev, incomingMsg];
         });
         
         if (incomingMsg.sender_id === activeChat.user_id) {
             markChatAsRead();
         }

         setTimeout(scrollToBottom, 100);
      }
    }
  }, [lastMessage, activeChat.user_id, user]);

  useEffect(() => {
      if (isTyping) scrollToBottom();
  }, [isTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value);

      if (!user?.id) return;

      if (!typingTimeoutRef.current) {
          api.post('/messages/typing', { receiver_id: activeChat.user_id, status: 'start' }).catch(() => {});
      }

      if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
          api.post('/messages/typing', { receiver_id: activeChat.user_id, status: 'stop' }).catch(() => {});
          typingTimeoutRef.current = null;
      }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    
    const text = newMessage;
    setNewMessage(""); 

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        api.post('/messages/typing', { receiver_id: activeChat.user_id, status: 'stop' }).catch(() => {});
        typingTimeoutRef.current = null;
    }

    // 1. Create Temporary ID
    const tempId = Date.now(); 

    const optimisticMsg = {
        id: tempId, 
        sender_id: Number(user?.id),
        receiver_id: activeChat.user_id,
        content: text,
        timestamp: new Date().toISOString(),
        is_read: false,
        message_type: "text"
    };

    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();
    onMessageSent(text); 

    try {
        // Wait for Real ID from Backend
        const response = await messagesAPI.sendMessage(activeChat.user_id, text);
        
        // SWAP TRICK: Find the temp message and give it the real ID
        setMessages(prev => prev.map(msg => 
            msg.id === tempId ? { ...msg, id: response.id } : msg
        ));

    } catch (error) {
        toast.error("Failed to send");
        // Remove the optimistic message if it failed
        setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleSendReminder = async (appointmentId: number) => {
    try {
        await api.post("/messages/send-reminder", {
            receiver_id: activeChat.user_id,
            appointment_id: appointmentId
        });
        onMessageSent("📅 Appointment Reminder");
    } catch (err) {
        toast.error("Failed to send reminder");
    }
  };

  const handleStartVideoCall = async () => {
    if (!activeChat || !user?.id) return;
    const currentUserId = Number(user.id);
    const id1 = Math.min(currentUserId, activeChat.user_id);
    const id2 = Math.max(currentUserId, activeChat.user_id);
    const roomId = `BukCare_Consult_${id1}_${id2}_${Date.now()}`;
    const inviteMessage = `📞 Started a Video Call. Join here: ${roomId}`;
    
    const optimisticMsg = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: activeChat.user_id,
        content: inviteMessage,
        timestamp: new Date().toISOString(),
        is_read: false,
        message_type: "text"
    };
    setMessages(prev => [...prev, optimisticMsg]);
    onMessageSent("📞 Video Call");

    try {
       await messagesAPI.sendMessage(activeChat.user_id, inviteMessage);
       window.open(`https://meet.jit.si/${roomId}`, "_blank");
    } catch(err) { toast.error("Failed to start call"); }
  };

  const handleDeleteMessage = async (msgId: number) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "Message unsent" } : m));
    setActiveMessageId(null);
    try { await messagesAPI.deleteMessage(msgId); } catch { toast.error("Failed to delete"); }
  };

  const renderMessage = (msg: any) => {
    const isMe = msg.sender_id === (Number(user?.id) || 0);
    const isDeleted = msg.content === "Message unsent" || msg.is_delete;

    if (msg.message_type === "appointment_reminder" && msg.appointment) {
        return (
            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
                <div className={`max-w-xs w-full rounded-2xl overflow-hidden shadow-md border ${isMe ? "bg-white border-purple-100 ring-2 ring-purple-50" : "bg-white border-slate-200"}`}>
                    <div className={`px-4 py-3 border-b flex items-center gap-2 ${isMe ? "bg-purple-50/50" : "bg-slate-50"}`}>
                        <Calendar className={`w-4 h-4 ${isMe ? "text-purple-600" : "text-slate-500"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-purple-700" : "text-slate-600"}`}>Appointment Reminder</span>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 min-w-[60px] text-center shadow-inner">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">{new Date(msg.appointment.appointment_date).toLocaleDateString('en-US', {month:'short'})}</span>
                                <span className="block text-2xl font-bold text-slate-800">{new Date(msg.appointment.appointment_date).getDate()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-400"/>
                                    {formatMessageTime(msg.appointment.appointment_date)}
                                </p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase mt-2 inline-block shadow-sm ${
                                    msg.appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {msg.appointment.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative animate-slide-up`} onMouseLeave={() => setActiveMessageId(null)}>
            {isMe && !isDeleted && (
                <div className="relative flex items-center">
                    <button className={`p-1 mr-2 text-slate-300 hover:text-slate-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeMessageId === msg.id ? 'opacity-100' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msg.id ? null : msg.id); }}>
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMessageId === msg.id && (
                        <div className="absolute bottom-8 right-0 bg-white shadow-xl border border-slate-100 rounded-xl py-1 w-32 z-10 overflow-hidden animate-in zoom-in-95 duration-100">
                            <button onClick={() => handleDeleteMessage(msg.id)} className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"><Trash2 className="w-3.5 h-3.5" /> Unsend</button>
                        </div>
                    )}
                </div>
            )}
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm relative text-sm leading-relaxed ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'} ${isDeleted ? 'opacity-70 italic bg-blue-50 border-gray-200 text-gray-500 shadow-none' : ''}`}>
                <div>
                    {msg.content.includes("📞 Started a Video Call") ? (
                        <div className="flex flex-col gap-3 my-1">
                            <span className="font-bold opacity-90 flex items-center gap-2"><VideoIcon className="w-4 h-4" /> Video Call Invite</span>
                            <button onClick={() => window.open(`https://meet.jit.si/${msg.content.split("Join here:")[1]?.trim()}`, "_blank")} className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${isMe ? "bg-white text-blue-600" : "bg-blue-600 text-white"}`}>
                                Join Meeting
                            </button>
                        </div>
                    ) : ( msg.content )}
                </div>
                {!isDeleted && <p className={`text-[10px] mt-1 text-right opacity-70`}>{formatMessageTime(msg.timestamp)}</p>}
            </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative">
      <AppointmentSelectorModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        receiverId={activeChat.user_id}
        onSend={handleSendReminder}
      />

      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden border border-slate-100">
                {activeChat.picture ? <img src={activeChat.picture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold">{activeChat.name.charAt(0)}</div>}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 leading-tight">{activeChat.name}</h3>
            <p className="text-[11px] text-slate-500 font-medium capitalize">{activeChat.role}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={handleStartVideoCall} className="p-2.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors rounded-xl" title="Start Video Call"><VideoIcon className="w-5 h-5" /></button>
          <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg, idx) => <div key={idx}>{renderMessage(msg)}</div>)}
        
        {isTyping && (
            <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                </div>
            </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
          <button 
            type="button" 
            onClick={() => setIsReminderModalOpen(true)}
            className="p-3 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors active:scale-95"
            title="Send Appointment Reminder"
          >
            <Calendar className="w-5 h-5" />
          </button>

          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
            value={newMessage}
            onChange={handleTyping}
          />
          
          <button type="submit" disabled={!newMessage.trim()} className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200 active:scale-95">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;