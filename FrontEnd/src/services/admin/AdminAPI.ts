import BaseAPI from "../BaseAPI";

// -----------------------------
// Type Definitions
// -----------------------------

export interface SystemHealth {
  backend_status: string;
  database_status: string;
  uptime: string;
}

export interface WeeklyGrowthData {
  name: string;
  patients: number;
  doctors: number;
  admins: number;
  staffs: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  totalStaff: number;
  totalAppointments: number;
  appointmentsBreakdown: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  pendingDoctorApprovals: number;
  activeUsers: number;
  newUsersThisWeek: number;
  weeklyGrowth: WeeklyGrowthData[];
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

// -----------------------------
// System Health
// -----------------------------

export async function getSystemHealth(): Promise<SystemHealth> {
  try {
    const { data } = await BaseAPI.get("/admin/health");

    return {
      backend_status: data.backend_status || "Unknown",
      database_status: data.database_status || "Unknown",
      uptime: data.uptime || "0s",
    };
  } catch (error: any) {
    console.error("Failed to fetch system health:", error);
    // Return safe default values instead of throwing, so the dashboard doesn't crash completely
    return {
      backend_status: "Error",
      database_status: "Error",
      uptime: "0s",
    };
  }
}

// -----------------------------
// Dashboard Statistics
// -----------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // This connects to the @router.get("/dashboard-stats") in your admin.py
    const { data } = await BaseAPI.get("/admin/dashboard-stats");
    return data;
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      "Failed to fetch dashboard statistics"
    );
  }
}

// -----------------------------
// Export
// -----------------------------

export async function exportReport(type: "users" | "appointments"): Promise<void> {
  try {
    const response = await BaseAPI.get(`/admin/export-report`, {
      params: { report_type: type },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("Failed to export report:", error);
    throw new Error("Failed to export report");
  }
}

export default {
  getSystemHealth,
  getDashboardStats,
  exportReport,
};