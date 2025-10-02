// src/pages/staff/Appointments.jsx
import Navbar from '../../components/Navbar';

export default function Appointments() {
  return (
    <div>
      <Navbar role="staff" />
      <h1 className="text-2xl font-bold mt-4">Staff Appointments</h1>
      <p>Manage and view all appointments for patients and doctors.</p>
    </div>
  );
}
