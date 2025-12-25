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
  // URL: /v1/notifications/
  getAll: async () => {
    const response = await api.get("/notifications/");
    return response.data;
  },

  // Get Unread Count (For the Red Badge)
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Mark specific notification as read
  // URL: /v1/notifications/{id}/read (PATCH)
  markAsRead: async (id: number) => {
    // FIXED: Changed PUT to PATCH
    await api.patch(`/notifications/${id}/read`);
  },

  // Mark all as read
  // URL: /v1/notifications/mark-all-read (PATCH)
  markAllAsRead: async () => {
    // FIXED: Changed URL to match backend and PUT to PATCH
    await api.patch("/notifications/mark-all-read");
  },
  
  // Delete notification
  delete: async (id: number) => {
      await api.delete(`/notifications/${id}`);
  }
};

export default notificationsAPI;