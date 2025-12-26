import api from "./api"; 

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  appointment_id?: number; 
}

const notificationsAPI = {
  // Get all notifications
  getAll: async () => {
    const response = await api.get("/notifications/");
    return response.data;
  },

  // Get Unread Count
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Mark specific notification as read
  markAsRead: async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
  },

  // RENAMED to match Navbar: markAllRead
  markAllRead: async () => {
    await api.patch("/notifications/read/all"); 
  },
  
  // DELETE Function
  delete: async (id: number) => {
      await api.delete(`/notifications/${id}`);
  }
};

export default notificationsAPI;