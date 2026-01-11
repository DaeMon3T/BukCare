import api from "./api";

export interface UserSearchResult {
  id: number;
  name: string;
  role: string;
  picture?: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  timestamp: string;
  is_read: boolean;
  sender_name?: string;
  sender_picture?: string;
  message_type?: "text" | "image" | "file" | "appointment_reminder";
  is_delete?: boolean;
  appointment?: any; 
}

export interface Conversation {
  user_id: number;
  name: string;
  role: string;
  picture?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const messagesAPI = {

  searchUsers: async (query: string): Promise<UserSearchResult[]> => {
    const response = await api.get(`/messages/search?query=${query}`);
    return response.data;
  },
  
  // Get list of people you've chatted with
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get("/messages/conversations");
    return response.data;
  },

  // Get chat history with a specific user
  getChatHistory: async (otherUserId: number): Promise<Message[]> => {
    const response = await api.get(`/messages/${otherUserId}`);
    return response.data;
  },

  // Send a new message
  sendMessage: async (receiverId: number, content: string): Promise<Message> => {
    const response = await api.post("/messages/", {
      receiver_id: receiverId,
      content: content,
    });
    return response.data;
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/messages/${messageId}`);
  },

  markAsRead: async (otherUserId: number) => {
    const response = await api.put(`/messages/read/${otherUserId}`);
    return response.data;
  },

  sendTypingStatus: async (receiverId: number, status: 'start' | 'stop') => {
    return api.post('/messages/typing', { receiver_id: receiverId, status });
  }
};

export default messagesAPI;