// src/pages/common/NotificationsPage.tsx
import React, { useState } from "react";
import Navbar from "../../components/Navbar";
import Notification from "../../components/Notification";

export interface NotificationItem {
  id: number;
  title?: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  is_read: boolean;
}

const sampleNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Appointment Reminder",
    message: "You have an appointment tomorrow at 10:00 AM",
    type: "info",
    is_read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "Your payment was successful",
    type: "success",
    is_read: true,
  },
  {
    id: 3,
    title: "Profile Incomplete",
    message: "Complete your profile to book appointments",
    type: "warning",
    is_read: false,
  },
];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(sampleNotifications);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null); // For three-dot menu

  const handleNotificationClick = (id: number) => {
    const notif = notifications.find((n) => n.id === id);
    if (!notif) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    setToast(notif);
    setTimeout(() => setToast(null), 5000);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setActiveMenu(null);
  };

  const hideNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setActiveMenu(null);
  };

  return (
    <div>
      <Navbar />

      <div className="p-6 max-w-4xl mx-auto mt-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications</p>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`relative w-full text-left p-4 rounded-lg border flex justify-between items-center transition-colors duration-200 ${
                  n.is_read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                } hover:bg-gray-50`}
              >
                <div onClick={() => handleNotificationClick(n.id)} className="flex-1 cursor-pointer">
                  {n.title && <p className="font-semibold text-gray-800">{n.title}</p>}
                  <p className="text-gray-600">{n.message}</p>
                </div>

                {/* Three dots menu */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === n.id ? null : n.id)}
                    className="ml-2 text-gray-500 hover:text-gray-800"
                  >
                    ⋮
                  </button>

                  {activeMenu === n.id && (
                    <div className="absolute right-0 top-6 bg-white border rounded shadow-lg w-40 z-50">
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => hideNotification(n.id)}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Hide notification
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Notification
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
            duration={5000}
          />
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
