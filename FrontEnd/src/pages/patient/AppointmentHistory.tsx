// FrontEnd/src/pages/patient/AppointmentHistory.tsx
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Navbar from "@/components/Navbar";

interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const PatientAppointmentHistory = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<"completed" | "cancelled">("completed");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchHistory = async (page: number = 1) => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        page_size: 10,
      };
      if (statusFilter !== "completed" && statusFilter !== "cancelled") {
        params.status = statusFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await api.get("/appointments/history", { params });
      setAppointments(response.data.appointments);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error("Failed to load appointment history:", err);
      toast.error("Failed to load appointment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter, startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const clearFilters = () => {
    setStatusFilter("completed");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  if (loading && pagination.page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment History</h2>
          <p className="text-gray-600 text-sm">View your past completed and cancelled appointments</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* Status Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex gap-2 flex-wrap">
              {["all", "completed", "cancelled"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as typeof statusFilter)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Date Range */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name or reason..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-4 flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {appointments.length} of {pagination.total_count} appointments
          </p>
        </div>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No appointment history found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow mb-6">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Time</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((appt) => {
                    const { date, time } = formatDateTime(appt.appointment_date);
                    return (
                      <tr key={appt.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-sm text-gray-900 font-medium">
                          {appt.doctor_name}
                        </td>
                        <td className="p-4 text-sm text-gray-900">{date}</td>
                        <td className="p-4 text-sm text-gray-900">{time}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {appt.reason || "No reason provided"}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              appt.status
                            )}`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {appt.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 mb-6">
              {appointments.map((appt) => {
                const { date, time } = formatDateTime(appt.appointment_date);
                return (
                  <div
                    key={appt.id}
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{appt.doctor_name}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {appt.id}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          appt.status
                        )}`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Date:</span>{" "}
                        <span className="text-gray-900">{date}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Time:</span>{" "}
                        <span className="text-gray-900">{time}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">Reason:</span>{" "}
                        <span className="text-gray-600">{appt.reason || "No reason provided"}</span>
                      </p>
                      {appt.notes && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">Notes:</span>{" "}
                          <span className="text-gray-600">{appt.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow p-4">
                <button
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={!pagination.has_prev || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pagination.has_prev && !loading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.total_pages}
                </span>

                <button
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={!pagination.has_next || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    pagination.has_next && !loading
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentHistory;