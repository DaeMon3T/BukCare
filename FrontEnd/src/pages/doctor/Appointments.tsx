// src/pages/doctor/Appointments.tsx
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar.js";

interface Appointment {
  id: number;
  patientName: string;
  date: string;
  time: string;
  status: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Example: fetch appointments later from API
    // fetch("/api/doctor/appointments")
    //   .then((res) => res.json())
    //   .then((data) => setAppointments(data))
    //   .catch((err) => console.error(err))
    //   .finally(() => setLoading(false));

    // Temporary mock data for testing
    const mockData: Appointment[] = [
      {
        id: 1,
        patientName: "John Doe",
        date: "2025-10-15",
        time: "10:00 AM",
        status: "Confirmed",
      },
      {
        id: 2,
        patientName: "Jane Smith",
        date: "2025-10-16",
        time: "2:30 PM",
        status: "Pending",
      },
    ];
    setAppointments(mockData);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="doctor" />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Doctor Appointments</h1>

        {loading ? (
          <p className="text-gray-500">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p className="text-gray-500">No appointments yet.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 bg-white rounded-xl shadow border border-gray-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">
                  {appt.patientName}
                </h2>
                <p className="text-sm text-gray-600">
                  {appt.date} at {appt.time}
                </p>
                <p
                  className={`text-sm mt-1 font-medium ${
                    appt.status === "Confirmed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {appt.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
