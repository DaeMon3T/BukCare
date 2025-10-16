import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="patient" />

      <main className="flex-grow px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose max-w-none text-gray-700">

          <h2>1. Introduction</h2>
          <p>
            The BUKCARE system respects your privacy and is committed to protecting personal and health-related information.
            This Privacy Policy explains how we collect, use, and secure your data in compliance with HIPAA and the Data Privacy Act of 2012 (RA 10173) of the Philippines.
          </p>

          <h2>2. Information We Collect</h2>
          <ul>
            <li>Personal Information: full name, contact details, date of birth.</li>
            <li>Appointment Details: doctor’s name, date, purpose of consultation.</li>
            <li>System Usage Data: login history, device info, interaction records.</li>
            <li>Optional Medical Information: brief reason for visit or follow-up purpose.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <ul>
            <li>Managing and scheduling appointments efficiently.</li>
            <li>Sending automated reminders and updates.</li>
            <li>Analyzing system usage for improvement and maintenance.</li>
            <li>Facilitating secure communication between staff and patients.</li>
          </ul>
          <p>We do not sell or disclose your information to third parties for marketing or non-health purposes.</p>

          <h2>4. Data Storage and Security</h2>
          <ul>
            <li>Encrypted storage and transmission of sensitive data.</li>
            <li>Role-based access control (RBAC) for staff and doctors.</li>
            <li>Secure HTTPS communication and periodic backups.</li>
            <li>Limited retention of personal data based on necessity and law.</li>
          </ul>
          <p>All information is handled per HIPAA and the Data Privacy Act.</p>

          <h2>5. Data Retention and Deletion</h2>
          <ul>
            <li>Data is retained only as long as necessary.</li>
            <li>Users may request correction, deletion, or deactivation of accounts.</li>
            <li>Deleted data is permanently removed after the retention period.</li>
          </ul>

          <h2>6. Data Sharing and Disclosure</h2>
          <ul>
            <li>Authorized Access: staff and doctors needing info for patient care.</li>
            <li>Legal Obligation: as required by law or government regulation.</li>
            <li>Emergency Situations: to protect life or prevent serious harm.</li>
          </ul>

          <h2>7. Your Rights</h2>
          <ul>
            <li>Access and request a copy of your personal info.</li>
            <li>Correct or update inaccurate records.</li>
            <li>Withdraw consent or restrict processing of data.</li>
            <li>File complaints with the project team or Data Privacy authority.</li>
          </ul>

          <h2>8. Cookies and Tracking</h2>
          <p>You may disable cookies, but some features may not work properly.</p>

          <h2>9. Third-Party Services</h2>
          <p>If the system integrates third-party APIs (SMS, email), these services must comply with HIPAA and Data Privacy Act standards.</p>

          <h2>10. Policy Updates</h2>
          <p>Policy may be updated periodically. Revisions will be posted, and continued use signifies acceptance.</p>

          <h2>11. Contact Information</h2>
          <p>
            For privacy concerns, data access requests, or reporting unauthorized use, contact:
            <br />
            System Proponents – Capstone Project Team
            <br />
            📧 Email: bukcare.project@gmail.com
            <br />
            📞 Phone: +63 912 345 6789
            <br />
            🏫 Institution: Central Mindanao University
            <br />
            📍 Address: Musuan, Maramag, Bukidnon, Philippines
          </p>

          <p>Effective Date: [Insert Date]<br/>Version: 1.0</p>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
