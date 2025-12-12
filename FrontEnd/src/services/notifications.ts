import api from "./api";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const notificationsAPI = {
  // Get all notifications for current user
  getAll: async () => {
    const response = await api.get("/notifications");
    return response.data;
  },

  // Mark specific notification as read
  markAsRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },

  // Mark all as read
  markAllAsRead: async () => {
    await api.put("/notifications/read-all");
  }
};

export default notificationsAPI;