import BaseAPI from "../BaseAPI.ts";

// -----------------------------
// Type Definitions
// -----------------------------

export interface SystemHealth {
  backend_status: string;
  database_status: string;
  uptime: string;
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
    throw new Error(
      error.response?.data?.detail ||
      error.message ||
      "Failed to fetch system health"
    );
  }
}

// -----------------------------
// Export
// -----------------------------

export default {
  getSystemHealth,
  
};
