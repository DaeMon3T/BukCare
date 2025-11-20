import React, { useState, useEffect } from "react";
import { Server, Activity, Database } from "lucide-react";

import Navbar from "@/components/Navbar";
import Notification from "@/components/Notification";
import adminAPI from "@/services/admin/AdminAPI";
import { useAuth } from "@/context/AuthContext";

interface NotificationData {
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface SystemHealth {
  backend_status: string;
  database_status: string;
  uptime: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    backend_status: "Unknown",
    database_status: "Unknown",
    uptime: "0s",
  });
  const [loading, setLoading] = useState<boolean>(true);

  const showNotification = (type: NotificationData["type"], message: string) => {
    setNotification({ type, message });
  };

  const closeNotification = () => setNotification(null);

  const loadSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSystemHealth();
      setSystemHealth(response);
    } catch (error) {
      console.error(error);
      showNotification("error", "Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemHealth();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 overflow-hidden">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}

      <Navbar />

      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {user?.name || "Admin"}!
              </h1>
              <p className="text-purple-100">
                Monitor your platform’s system health in real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Backend Status</h3>
                  <p className="text-xl font-bold text-gray-800">
                    {loading ? "..." : systemHealth.backend_status}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Database Status</h3>
                  <p className="text-xl font-bold text-gray-800">
                    {loading ? "..." : systemHealth.database_status}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Uptime</h3>
                  <p className="text-xl font-bold text-gray-800">
                    {loading ? "..." : systemHealth.uptime}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
