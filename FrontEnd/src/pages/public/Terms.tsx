import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="patient" />

      <main className="flex-grow px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
        <div className="prose max-w-none text-gray-700">

          <h2>1. Introduction</h2>
          <p>
            Welcome to the BUKCARE: ENHANCING HEALTHCARE EFFICIENCY THROUGH AUTOMATED SCHEDULING AND PATIENT NOTIFICATIONS IN BUKIDNON.
            By accessing or using this system, you agree to comply with these Terms and Conditions. These terms ensure the ethical, secure, and proper use of the system in line with healthcare privacy standards, including HIPAA.
            This system was developed as part of an academic capstone project aimed at improving hospital appointment management, streamlining communication, and reducing administrative workload within Bukidnon Provincial Hospital – Maramag (BPH-Maramag).
          </p>

          <h2>2. Purpose of the System</h2>
          <ul>
            <li>Provide a centralized digital platform for scheduling, rescheduling, and managing appointments.</li>
            <li>Allow doctors to update and manage their availability in real time.</li>
            <li>Send automated email and SMS notifications to patients about appointment reminders and schedule changes.</li>
            <li>Improve administrative efficiency and minimize manual scheduling errors.</li>
          </ul>

          <h2>3. User Responsibilities</h2>
          <ul>
            <li>Provide accurate and truthful information during registration and booking.</li>
            <li>Keep login credentials confidential and secure.</li>
            <li>Notify hospital administration of any unauthorized access or data breach.</li>
            <li>Use the system only for its intended purpose and refrain from misuse, modification, or disruption.</li>
          </ul>

          <h2>4. Data Privacy and HIPAA Compliance</h2>
          <p>This System follows HIPAA principles to protect patient health information (PHI):</p>
          <ul>
            <li>Data Collection: basic personal and appointment data such as names, contact info, consultation details.</li>
            <li>Use of Data: only for appointment scheduling, communication, and hospital analytics.</li>
            <li>Data Security: securely stored and accessible only to authorized hospital staff and doctors.</li>
            <li>Confidentiality: no personal or medical info shared without consent except when required by law or emergencies.</li>
            <li>Access Control: role-based access ensures only authorized users can view/modify relevant data.</li>
          </ul>
          <p>By using the System, you consent to the collection and secure processing of your data under these terms.</p>

          <h2>5. System Availability and Limitations</h2>
          <ul>
            <li>The system depends on stable internet and may experience downtime for maintenance or technical issues.</li>
            <li>Doctor availability depends on manual updates and may sometimes be inaccurate.</li>
            <li>The hospital and developers are not liable for missed appointments or delays from connectivity issues, user errors, or technical problems.</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>All system content, code, and design are protected by copyright and intellectual property laws. Users cannot copy, distribute, or modify any part without prior authorization.</p>

          <h2>7. Consent to Communication</h2>
          <p>By registering, users agree to receive email/SMS notifications for:</p>
          <ul>
            <li>Appointment confirmations and reminders</li>
            <li>Doctor availability updates</li>
            <li>System alerts or announcements</li>
          </ul>
          <p>Users may request to disable non-critical notifications, but this may affect timely reminders.</p>

          <h2>8. Disclaimer</h2>
          <p>The system is developed for academic and hospital improvement purposes. The hospital and developers are not responsible for damages or losses due to misuse, errors, or downtime. The system does not provide medical advice.</p>

          <h2>9. User Acknowledgment</h2>
          <p>By using the System, users confirm they have read, understood, and agreed to these Terms and Conditions. Violations may result in access suspension, termination, or legal action.</p>

          <h2>10. Contact Information</h2>
          <p>
            For inquiries or reports related to privacy, data, or technical issues, contact:
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

export default Terms;
