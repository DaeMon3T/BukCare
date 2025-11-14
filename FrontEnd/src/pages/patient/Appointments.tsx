// src/pages/patient/Appointments.tsx
import Navbar from '@/components/Navbar';

interface Appointment {
  id: number;
  doctor: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}

export default function Appointments(): JSX.Element {
  // Dummy appointment data
  const appointments: Appointment[] = [
    {
      id: 1,
      doctor: 'Dr. John Smith',
      date: '2025-11-20',
      time: '10:00 AM',
      status: 'Upcoming',
    },
    {
      id: 2,
      doctor: 'Dr. Emily Brown',
      date: '2025-11-15',
      time: '02:30 PM',
      status: 'Completed',
    },
    {
      id: 3,
      doctor: 'Dr. Alex Johnson',
      date: '2025-11-22',
      time: '11:00 AM',
      status: 'Upcoming',
    },
    {
      id: 4,
      doctor: 'Dr. Sarah Lee',
      date: '2025-11-10',
      time: '09:00 AM',
      status: 'Cancelled',
    },
  ];

  return (
    <div>
      <Navbar role="patient" />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Appointments</h1>
        <p className="mb-6 text-gray-600">See your scheduled appointments.</p>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Doctor</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Time</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{appt.doctor}</td>
                  <td className="px-4 py-2">{appt.date}</td>
                  <td className="px-4 py-2">{appt.time}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        appt.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-800'
                          : appt.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {appt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// /