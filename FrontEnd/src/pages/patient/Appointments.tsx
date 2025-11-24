import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/utils/api";
import Navbar from "@/components/Navbar"; // ✅ Import Navbar

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  reason: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled" | "completed">("all");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/appointments/"); // endpoint for patient’s own appointments
      setAppointments(response.data);
    } catch (err: any) {
      console.error("Failed to load appointments:", err);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "all") return true;
    return appt.status === filter;
  });

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
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-auto">
      {/* Navbar */}
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Appointments</h2>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== "all" && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {appointments.filter((a) => a.status === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-500">No appointments found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Doctor ID
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Time
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Reason
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAppointments.map((appt) => {
                    const { date, time } = formatDateTime(appt.appointment_date);
                    return (
                      <tr key={appt.id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-sm text-gray-900">Doctor #{appt.doctor_id}</td>
                        <td className="p-4 text-sm text-gray-900">{date}</td>
                        <td className="p-4 text-sm text-gray-900">{time}</td>
                        <td className="p-4 text-sm text-gray-600">{appt.reason || "No reason provided"}</td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              appt.status
                            )}`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredAppointments.map((appt) => {
                const { date, time } = formatDateTime(appt.appointment_date);
                return (
                  <div
                    key={appt.id}
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Doctor #{appt.doctor_id}</p>
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
          </>
        )}
      </div>
    </div>
  );
};

export default PatientAppointments;
