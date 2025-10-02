// src/pages/staff/Home.jsx
import Navbar from '../../components/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar role="staff" />
      <h1 className="text-2xl font-bold mt-4">Staff Home</h1>
      <p>Welcome to your staff dashboard!</p>
    </div>
  );
}
