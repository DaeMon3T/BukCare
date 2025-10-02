// src/pages/doctor/Profile.jsx
import Navbar from '../../components/Navbar';

export default function Profile() {
  return (
    <div>
      <Navbar role="doctor" />
      <h1 className="text-2xl font-bold mt-4">Doctor Profile</h1>
      <p>View and update your professional information.</p>
    </div>
  );
}
