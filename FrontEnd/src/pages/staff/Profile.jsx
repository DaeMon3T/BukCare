// src/pages/staff/Profile.jsx
import Navbar from '../../components/Navbar';

export default function Profile() {
  return (
    <div>
      <Navbar role="staff" />
      <h1 className="text-2xl font-bold mt-4">Staff Profile</h1>
      <p>View and update your staff account details.</p>
    </div>
  );
}
