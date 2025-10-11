// src/pages/doctor/Profile.tsx
import React from "react";
import Navbar from "../../components/Navbar.js";

const Profile: React.FC = () => {
  return (
    <div>
      <Navbar role="doctor" />
      <h1 className="text-2xl font-bold mt-4">Doctor Profile</h1>
      <p>View and update your professional information.</p>
    </div>
  );
};

export default Profile;
