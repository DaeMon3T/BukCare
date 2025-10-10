// src/pages/patient/Appointments.jsx
import Navbar from '@/components/Navbar';

export default function Appointments() {
  return (
    <div>
      <Navbar role="patient" />
      <h1 className="text-2xl font-bold mt-4">Patient Appointments</h1>
      <p>See your scheduled appointments.</p>
    </div>
  );
}
