// src/pages/doctor/Appointments.jsx
import Navbar from '../../components/Navbar';

export default function Appointments() {
  return (
    <div>
      <Navbar role="doctor" />
      <h1 className="text-2xl font-bold mt-4">Doctor Appointments</h1>
      <p>Manage your scheduled appointments.</p>
    </div>
  );
}
