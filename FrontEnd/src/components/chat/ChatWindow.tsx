import React, { useState, useEffect, useRef } from "react";
import { Send, MoreVertical, Phone, Video as VideoIcon, ArrowLeft, Trash2, Reply, Calendar, Clock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "@/context/WebSocketContext";
import messagesAPI, { type Conversation, type Message } from "@/services/messages";
import api from "@/services/api";
import toast from "react-hot-toast";
import AppointmentSelectorModal from "./AppointmentSelectorModal";

interface ChatWindowProps {
  activeChat: Conversation;
  onBack: () => void;
  onMessageSent: (text: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ activeChat, onBack, onMessageSent }) => {
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  // 1. Load History
  useEffect(() => {
    loadChatHistory();
  }, [activeChat]);

  const loadChatHistory = async () => {
    try {
      const history = await messagesAPI.getChatHistory(activeChat.user_id);
      setMessages(history);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 2. WebSocket Listener (Specific to Window)
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "MESSAGE_DELETED") {
      setMessages(prev => prev.map(m => m.id === lastMessage.message_id ? { ...m, content: "Message unsent" } : m));
    }

    if (lastMessage.type === "CHAT_MESSAGE" && lastMessage.message) {
      const incomingMsg = lastMessage.message;
      const currentUserId = Number(user?.id);
      
      // Only show if it belongs to this active chat
      if ((incomingMsg.sender_id === activeChat.user_id) || (incomingMsg.sender_id === currentUserId && incomingMsg.receiver_id === activeChat.user_id)) {
         setMessages(prev => {
            if (prev.some(m => m.id === incomingMsg.id)) return prev;
            // Handle Optimistic Replacement
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
         setTimeout(scrollToBottom, 100);
      }
    }
  }, [lastMessage, activeChat, user]);

  // 3. Send Text Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newMessage.trim()) return;
    
    const text = newMessage;
    setNewMessage(""); // Clear input immediately

    // Optimistic Update
    const optimisticMsg = {
        id: Date.now(),
        sender_id: Number(user?.id),
        receiver_id: activeChat.user_id,
        content: text,
        timestamp: new Date().toISOString(),
        is_read: false,
        message_type: "text"
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();
    onMessageSent(text); // Update sidebar preview

    try {
        await messagesAPI.sendMessage(activeChat.user_id, text);
    } catch (error) {
        toast.error("Failed to send");
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  // 4. Send Appointment Reminder
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

  // 5. Video Call Logic (Preserved)
  const handleStartVideoCall = async () => {
    if (!activeChat || !user?.id) return;
    const currentUserId = Number(user.id);
    const id1 = Math.min(currentUserId, activeChat.user_id);
    const id2 = Math.max(currentUserId, activeChat.user_id);
    const roomId = `BukCare_Consult_${id1}_${id2}_${Date.now()}`;
    const inviteMessage = `📞 Started a Video Call. Join here: ${roomId}`;
    
    // Manually add optimistic msg for video
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

  // 6. Delete Logic
  const handleDeleteMessage = async (msgId: number) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "Message unsent" } : m));
    setActiveMessageId(null);
    try { await messagesAPI.deleteMessage(msgId); } catch { toast.error("Failed to delete"); }
  };

  // 7. Render Message Bubble
  const renderMessage = (msg: any) => {
    const isMe = msg.sender_id === (Number(user?.id) || 0);
    const isDeleted = msg.content === "Message unsent" || msg.is_delete;

    // A. APPOINTMENT CARD
    if (msg.message_type === "appointment_reminder" && msg.appointment) {
        return (
            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-xs w-full rounded-2xl overflow-hidden shadow-sm border ${isMe ? "bg-purple-50 border-purple-100" : "bg-white border-slate-200"}`}>
                    <div className={`px-4 py-2 border-b flex items-center gap-2 ${isMe ? "bg-purple-100/50 border-purple-100" : "bg-slate-50 border-slate-100"}`}>
                        <Calendar className={`w-4 h-4 ${isMe ? "text-purple-600" : "text-slate-500"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isMe ? "text-purple-700" : "text-slate-600"}`}>Appointment Reminder</span>
                    </div>
                    <div className="p-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-white border border-slate-100 rounded-lg p-2 min-w-[50px] text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">{new Date(msg.appointment.appointment_date).toLocaleDateString('en-US', {month:'short'})}</span>
                                <span className="block text-lg font-bold text-slate-800">{new Date(msg.appointment.appointment_date).getDate()}</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400"/>
                                    {new Date(msg.appointment.appointment_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase mt-1 inline-block ${
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

    // B. TEXT MESSAGE
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`} onMouseLeave={() => setActiveMessageId(null)}>
            {isMe && !isDeleted && (
                <div className="relative flex items-center">
                    <button className={`p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeMessageId === msg.id ? 'opacity-100' : ''}`} onClick={(e) => { e.stopPropagation(); setActiveMessageId(activeMessageId === msg.id ? null : msg.id); }}>
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMessageId === msg.id && (
                        <div className="absolute bottom-8 right-0 bg-white shadow-xl border border-slate-100 rounded-lg py-1 w-32 z-10">
                            <button onClick={() => handleDeleteMessage(msg.id)} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete</button>
                        </div>
                    )}
                </div>
            )}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'} ${isDeleted ? 'opacity-70 italic bg-gray-100 border-gray-200 text-gray-500' : ''}`}>
                <div className="text-sm">
                    {msg.content.includes("📞 Started a Video Call") ? (
                        <div className="flex flex-col gap-2 my-1">
                            <span className="font-medium opacity-90">Video Call Invite</span>
                            <button onClick={() => window.open(`https://meet.jit.si/${msg.content.split("Join here:")[1]?.trim()}`, "_blank")} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all ${isMe ? "bg-white text-purple-600" : "bg-purple-600 text-white"}`}>
                                <VideoIcon className="w-4 h-4" /> Join Call
                            </button>
                        </div>
                    ) : ( msg.content )}
                </div>
                {!isDeleted && <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
            </div>
        </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/30 relative">
      <AppointmentSelectorModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        receiverId={activeChat.user_id}
        onSend={handleSendReminder}
      />

      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            {activeChat.picture ? <img src={activeChat.picture} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-600 font-bold">{activeChat.name.charAt(0)}</div>}
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{activeChat.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{activeChat.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleStartVideoCall} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-purple-600 transition-colors rounded-full" title="Start Video Call"><VideoIcon className="w-5 h-5" /></button>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => <div key={idx}>{renderMessage(msg)}</div>)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 rounded-b-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          {/* 👇 NEW REMINDER BUTTON */}
          <button 
            type="button" 
            onClick={() => setIsReminderModalOpen(true)}
            className="p-3 text-slate-400 hover:bg-slate-50 hover:text-purple-600 rounded-xl transition-colors"
            title="Send Appointment Reminder"
          >
            <Calendar className="w-5 h-5" />
          </button>

          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;