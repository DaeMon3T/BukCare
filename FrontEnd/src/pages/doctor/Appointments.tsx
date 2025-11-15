import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/BaseAPI"
interface Patient {
  first_name: string;
  last_name: string;
  email: string;
}

interface Appointment {
  id: number;
  patient: Patient;
  date: string;
  time: string;
  status: string;
}

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await api.get("/appointments");
      setAppointments(response.data);
    } catch (err) {
      toast.error("Failed to load appointments");
    }
    setLoading(false);
  };

  const updateStatus = async (id: number, status: "accepted" | "declined") => {
    const endpoint =
      status === "accepted"
        ? `/api/v1/appointments/${id}/accept`
        : `/api/v1/appointments/${id}/decline`;

    try {
      await api.put(endpoint);
      toast.success(`Appointment ${status}`);
      fetchAppointments(); // refresh list
    } catch (err) {
      toast.error("Action failed");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  if (loading) return <p>Loading appointments...</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Appointments</h2>

      {/* ✅ Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Patient</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-b">
                <td className="p-3">
                  {appt.patient.first_name} {appt.patient.last_name}
                </td>
                <td className="p-3">{appt.date}</td>
                <td className="p-3">{appt.time}</td>
                <td className="p-3 capitalize">{appt.status}</td>
                <td className="p-3 space-x-2">
                  {appt.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(appt.id, "accepted")}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(appt.id, "declined")}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Mobile Cards */}
      <div className="md:hidden space-y-4">
        {appointments.map((appt) => (
          <div key={appt.id} className="bg-white p-4 rounded shadow">
            <p>
              <span className="font-medium">Patient:</span>{" "}
              {appt.patient.first_name} {appt.patient.last_name}
            </p>
            <p>
              <span className="font-medium">Date:</span> {appt.date}
            </p>
            <p>
              <span className="font-medium">Time:</span> {appt.time}
            </p>
            <p className="capitalize">
              <span className="font-medium">Status:</span> {appt.status}
            </p>

            {appt.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateStatus(appt.id, "accepted")}
                  className="flex-1 px-3 py-1 bg-green-600 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(appt.id, "declined")}
                  className="flex-1 px-3 py-1 bg-red-600 text-white rounded"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorAppointments;
