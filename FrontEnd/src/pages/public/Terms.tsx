// import React, { useState } from "react";
// import { Link } from "react-router-dom"; // Added this import for the Link component
// import Footer from "@/components/Footer";
// import { 
//   ScrollText, 
//   ShieldCheck, 
//   Info, 
//   Phone, 
//   MapPin, 
//   Clock, 
//   Mail, 
//   Stethoscope, 
//   CalendarCheck,
//   Lock,
//   Eye,
//   FileText,
//   AlertTriangle
// } from "lucide-react"; 

// const TermsAndPrivacy: React.FC = () => {
//   const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

//   return (
//     <div className="flex flex-col min-h-screen bg-white font-sans">
            
//       {/* --- INSERTED CODE START --- */}
//       <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             {/* Logo Placeholder to match image style */}
//             <div className="text-2xl font-bold text-slate-800">
//               <span className="text-[#0099cc]">Buk</span>Care
//             </div>
//           </div>
//           <Link
//             to="/"
//             className="text-slate-600 hover:text-[#0099cc] font-semibold transition-colors flex items-center gap-2 mr-10"
//           >
//             ← Back to Home
//           </Link>
//         </div>
//       </nav>
//       {/* --- INSERTED CODE END --- */}

//       {/* 2. HERO SECTION */}
//       <div className="relative w-full h-auto min-h-[450px] bg-sky-50 overflow-hidden transition-all duration-500">
//         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-sky-100 via-white to-sky-50 opacity-80 z-0"></div>
        
//         <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center h-full pt-12 md:pt-0">
          
//           {/* Left Text Content */}
//           <div className="md:w-1/2 pt-10 md:pt-20 pb-20 md:pr-10">
//             <h4 className="text-cyan-500 font-bold uppercase tracking-wider text-sm mb-2">
//               Legal & Compliance
//             </h4>
//             <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 leading-tight mb-6 transition-all duration-300">
//               BukCare <br/> 
//               <span className="text-slate-600">
//                 {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"}
//               </span>
//             </h1>
            
//             <p className="text-slate-500 text-lg mb-8 leading-relaxed">
//               {activeTab === "terms" 
//                 ? "Welcome to the BUKCARE system. By accessing or using this system, you agree to comply with these Terms. We are committed to operational integrity."
//                 : "Your privacy is paramount. This policy explains how we collect, use, and secure your data in compliance with HIPAA and the Data Privacy Act of 2012."
//               }
//             </p>

//             <div className="flex gap-4">
//               <button 
//                 onClick={() => setActiveTab("terms")}
//                 className={`py-3 px-6 rounded shadow-lg transition-all font-semibold ${activeTab === 'terms' ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
//               >
//                 Terms of Use
//               </button>
//               <button 
//                 onClick={() => setActiveTab("privacy")}
//                 className={`py-3 px-6 rounded shadow-lg transition-all font-semibold ${activeTab === 'privacy' ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
//               >
//                 Privacy Policy
//               </button>
//             </div>
//           </div>

//           {/* Right Image Content */}
//           <div className="md:w-1/2 h-full flex items-end justify-center md:justify-end relative">
//              <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
//              <img 
//                src="./bukcare_logo.png" 
//                alt="Medical Professional" 
//                className="relative z-10 h-[350px] md:h-[500px] object-cover object-top mask-image-gradient"
//              />
//           </div>
//         </div>
//       </div>

//       {/* 3. FEATURE CARDS STRIP */}
//       <div className="grid grid-cols-1 md:grid-cols-3 w-full ml-4">
//         <div className="bg-sky-500 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-600 cursor-pointer" onClick={() => setActiveTab("privacy")}>
//           <ShieldCheck className="w-12 h-12 mb-4 opacity-90" />
//           <h3 className="text-xl font-bold mb-3">HIPAA Compliance</h3>
//           <p className="text-sky-100 text-sm leading-relaxed mb-4">
//             We strictly follow HIPAA principles to protect patient health information (PHI). Your data is securely stored.
//           </p>
//           <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all">
//             Read Privacy Policy
//           </span>
//         </div>

//         <div className="bg-sky-400 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-500 cursor-pointer" onClick={() => setActiveTab("terms")}>
//           <Stethoscope className="w-12 h-12 mb-4 opacity-90" />
//           <h3 className="text-xl font-bold mb-3">User Responsibilities</h3>
//           <p className="text-sky-100 text-sm leading-relaxed mb-4">
//             Provide accurate info, keep credentials secure, and use the system only for intended scheduling purposes.
//           </p>
//           <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all">
//             View Guidelines
//           </span>
//         </div>

//         <div className="bg-sky-300 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-400">
//           <CalendarCheck className="w-12 h-12 mb-4 opacity-90" />
//           <h3 className="text-xl font-bold mb-3">24/7 Scheduling</h3>
//           <p className="text-sky-50 text-sm leading-relaxed mb-4">
//             Centralized platform for managing appointments and receiving real-time automated notifications.
//           </p>
//           <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all cursor-pointer">
//             Book Now
//           </span>
//         </div>
//       </div>

//       {/* 4. MAIN CONTENT AREA */}
//       <main className="flex-grow py-16 px-4 md:px-6 bg-white">
//         <div className="max-w-5xl mx-auto">
          
//           <div className="flex items-center gap-3 mb-12">
//             {activeTab === "terms" ? <ScrollText className="w-8 h-8 text-cyan-500" /> : <Lock className="w-8 h-8 text-cyan-500" />}
//             <h2 className="text-3xl font-bold text-gray-800">
//               {activeTab === "terms" ? "Detailed Terms & Agreements" : "Data Privacy & Security Policy"}
//             </h2>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
//             {/* Left Column (Navigation) */}
//             <div className="lg:col-span-1">
//                <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500 shadow-sm sticky top-10">
//                   <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
//                     <Info className="w-4 h-4" /> Quick Navigation
//                   </h3>
//                   <ul className="space-y-3 text-sm text-gray-600">
//                     <li 
//                       onClick={() => setActiveTab("terms")}
//                       className={`cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'terms' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}
//                     >
//                       • Terms of Use
//                     </li>
//                     <li 
//                       onClick={() => setActiveTab("privacy")}
//                       className={`cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'privacy' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}
//                     >
//                       • Privacy Policy (HIPAA)
//                     </li>
//                     <li className="text-gray-400 mt-4 pt-4 border-t border-gray-200 pointer-events-none">• Contact Details</li>
//                   </ul>
//                   <div className="mt-8 pt-6 border-t border-gray-200">
//                     <p className="text-xs text-gray-400">Effective Date: January 2025</p>
//                     <p className="text-xs text-gray-400">Version: 1.0</p>
//                   </div>
//                </div>
//             </div>

//             {/* Right Column (Content Switcher) */}
//             <div className="lg:col-span-2 space-y-10 text-gray-600 leading-relaxed animate-in fade-in duration-500">
              
//               {activeTab === "terms" ? (
//                 /* ================= TERMS CONTENT ================= */
//                 <>
//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">1</span> 
//                         Purpose of the System
//                       </h3>
//                       <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                         <li>Provide a centralized digital platform for scheduling, rescheduling, and managing appointments.</li>
//                         <li>Allow doctors to update and manage their availability in real time.</li>
//                         <li>Send automated email and SMS notifications to patients about appointment reminders and schedule changes.</li>
//                         <li>Improve administrative efficiency and minimize manual scheduling errors.</li>
//                       </ul>
//                   </section>

//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">2</span> 
//                         User Responsibilities
//                       </h3>
//                       <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                         <li>Provide accurate and truthful information during registration and booking.</li>
//                         <li>Keep login credentials confidential and secure.</li>
//                         <li>Notify hospital administration of any unauthorized access or data breach.</li>
//                         <li>Use the system only for its intended purpose and refrain from misuse, modification, or disruption.</li>
//                       </ul>
//                   </section>

//                   <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
//                       <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
//                         <ShieldCheck className="w-6 h-6 text-blue-600" />
//                         3. Data Privacy Overview
//                       </h3>
//                       <p className="mb-4 text-blue-800">This System follows HIPAA principles to protect patient health information (PHI):</p>
//                       <div className="grid md:grid-cols-2 gap-4 text-sm">
//                         <div className="bg-white p-3 rounded shadow-sm"><strong>Data Collection:</strong> Basic personal/contact info.</div>
//                         <div className="bg-white p-3 rounded shadow-sm"><strong>Use of Data:</strong> Scheduling & communication only.</div>
//                         <div className="bg-white p-3 rounded shadow-sm"><strong>Data Security:</strong> Securely stored & access controlled.</div>
//                         <div className="bg-white p-3 rounded shadow-sm"><strong>Confidentiality:</strong> No sharing without consent.</div>
//                       </div>
//                       <p 
//                         className="mt-4 font-medium text-blue-900 text-sm italic cursor-pointer hover:underline"
//                         onClick={() => setActiveTab("privacy")}
//                       >
//                         Click here to read the full Privacy Policy.
//                       </p>
//                   </section>

//                   <section>
//                     <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">4</span> 
//                        System Availability and Limitations
//                      </h3>
//                     <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                       <li>The system depends on stable internet and may experience downtime for maintenance or technical issues.</li>
//                       <li>Doctor availability depends on manual updates and may sometimes be inaccurate.</li>
//                       <li>The hospital and developers are not liable for missed appointments or delays from connectivity issues.</li>
//                     </ul>
//                   </section>

//                   <section>
//                     <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">5</span> 
//                        Intellectual Property
//                      </h3>
//                     <p>All system content, code, and design are protected by copyright and intellectual property laws. Users cannot copy, distribute, or modify any part without prior authorization.</p>
//                   </section>

//                   <section>
//                     <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">6</span> 
//                        Consent to Communication
//                      </h3>
//                     <p className="mb-2">By registering, users agree to receive email/SMS notifications for:</p>
//                     <div className="flex flex-wrap gap-2 mb-2">
//                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">Reminders</span>
//                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">Availability Updates</span>
//                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">System Alerts</span>
//                     </div>
//                   </section>

//                   <div className="border-t border-gray-200 pt-8 mt-8">
//                      <h3 className="text-lg font-bold text-gray-800 mb-2">Disclaimer</h3>
//                      <p className="text-sm text-gray-500 mb-6">
//                        The system is developed for academic and hospital improvement purposes. The hospital and developers are not responsible for damages or losses due to misuse, errors, or downtime. The system does not provide medical advice.
//                      </p>

//                      <h3 className="text-lg font-bold text-gray-800 mb-2">User Acknowledgment</h3>
//                      <p className="text-sm text-gray-500">
//                        By using the System, users confirm they have read, understood, and agreed to these Terms and Conditions. Violations may result in access suspension, termination, or legal action.
//                      </p>
//                   </div>
//                 </>
//               ) : (
//                 /* ================= PRIVACY CONTENT ================= */
//                 <>
//                   <p className="text-gray-500 italic mb-6">
//                     The BUKCARE system respects your privacy and is committed to protecting personal and health-related information. This Privacy Policy explains how we collect, use, and secure your data in compliance with <strong>HIPAA</strong> and the <strong>Data Privacy Act of 2012 (RA 10173)</strong> of the Philippines.
//                   </p>

//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <FileText className="w-5 h-5 text-cyan-600" />
//                         Information We Collect
//                       </h3>
//                       <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                         <li><strong>Personal Information:</strong> Full name, contact details, date of birth.</li>
//                         <li><strong>Appointment Details:</strong> Doctor’s name, date, purpose of consultation.</li>
//                         <li><strong>System Usage Data:</strong> Login history, device info, interaction records.</li>
//                         <li><strong>Optional Medical Information:</strong> Brief reason for visit or follow-up purpose.</li>
//                       </ul>
//                   </section>

//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <Eye className="w-5 h-5 text-cyan-600" />
//                         How We Use Your Information
//                       </h3>
//                       <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                         <li>Managing and scheduling appointments efficiently.</li>
//                         <li>Sending automated reminders and updates.</li>
//                         <li>Analyzing system usage for improvement and maintenance.</li>
//                         <li>Facilitating secure communication between staff and patients.</li>
//                       </ul>
//                       <p className="mt-2 text-sm bg-yellow-50 p-2 border border-yellow-200 rounded text-yellow-800">
//                         <AlertTriangle className="w-4 h-4 inline mr-1 mb-1"/> 
//                         We do not sell or disclose your information to third parties for marketing purposes.
//                       </p>
//                   </section>

//                   <section className="bg-green-50 p-6 rounded-lg border border-green-100">
//                       <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
//                         <Lock className="w-5 h-5 text-green-600" />
//                         Data Storage and Security
//                       </h3>
//                       <ul className="grid md:grid-cols-2 gap-4">
//                         <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
//                           <strong>Encrypted Storage:</strong> All sensitive data is encrypted at rest and in transit.
//                         </li>
//                         <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
//                           <strong>Access Control:</strong> Role-based access (RBAC) restricts data to authorized staff only.
//                         </li>
//                         <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
//                           <strong>Secure Connection:</strong> We use HTTPS protocols for all communications.
//                         </li>
//                         <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
//                           <strong>Backups:</strong> Periodic backups ensure data integrity.
//                         </li>
//                       </ul>
//                   </section>

//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold">?</span>
//                         Data Retention & Deletion
//                       </h3>
//                       <p className="mb-2">Data is retained only as long as necessary for the fulfillment of the purposes for which it was obtained or for the establishment, exercise or defense of legal claims, or for legitimate business purposes, or as provided by law.</p>
//                       <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
//                         <li>Users may request correction, deletion, or deactivation of accounts.</li>
//                         <li>Deleted data is permanently removed after the retention period.</li>
//                       </ul>
//                   </section>

//                   <section>
//                       <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
//                         <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold">!</span>
//                         Your Rights
//                       </h3>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
//                             <h5 className="font-bold text-cyan-700">Right to Access</h5>
//                             <p className="text-sm">Request a copy of your personal info.</p>
//                           </div>
//                           <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
//                             <h5 className="font-bold text-cyan-700">Right to Correct</h5>
//                             <p className="text-sm">Update inaccurate records.</p>
//                           </div>
//                           <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
//                             <h5 className="font-bold text-cyan-700">Right to Withdraw</h5>
//                             <p className="text-sm">Withdraw consent or restrict processing.</p>
//                           </div>
//                           <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
//                             <h5 className="font-bold text-cyan-700">Right to Complain</h5>
//                             <p className="text-sm">File complaints with the project team.</p>
//                           </div>
//                       </div>
//                   </section>

//                   <section>
//                     <h3 className="text-xl font-bold text-gray-800 mb-4">Cookies and Third-Party Services</h3>
//                     <p className="mb-4">
//                       You may disable cookies, but some features may not work properly. If the system integrates third-party APIs (SMS, email), these services are vetted to comply with HIPAA and Data Privacy Act standards.
//                     </p>
//                   </section>
//                 </>
//               )}

//               {/* Section 10: Contact Information (Shared) */}
//               <div className="bg-slate-800 text-slate-300 p-8 rounded-xl mt-8">
//                  <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
//                    <Info className="w-5 h-5 text-cyan-400"/> Contact Information
//                  </h3>
//                  <p className="mb-6 text-sm">
//                     {activeTab === 'terms' ? 'For inquiries regarding these Terms:' : 'For privacy concerns, data access requests, or reporting unauthorized use:'}
//                  </p>
//                  <div className="grid md:grid-cols-2 gap-8">
//                    <div>
//                       <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">System Proponents</p>
//                       <p className="font-semibold text-white">Capstone Project Team</p>
//                       <p className="mt-4 text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">Institution</p>
//                       <p className="text-white">Central Mindanao University</p>
//                       <p className="text-sm">Musuan, Maramag, Bukidnon, Philippines</p>
//                    </div>
//                    <div className="space-y-4">
//                      <div className="flex items-start gap-3">
//                         <Mail className="w-5 h-5 text-cyan-400 mt-1" />
//                         <div>
//                            <p className="text-xs text-gray-400 uppercase">Email Us</p>
//                            <p className="text-white">bukcare.project@gmail.com</p>
//                         </div>
//                      </div>
//                      <div className="flex items-start gap-3">
//                         <Phone className="w-5 h-5 text-cyan-400 mt-1" />
//                         <div>
//                            <p className="text-xs text-gray-400 uppercase">Call Us</p>
//                            <p className="text-white">+63 912 345 6789</p>
//                         </div>
//                      </div>
//                    </div>
//                  </div>
//               </div>

//             </div>
//           </div>
//         </div>
//       </main>

//       <Footer />
//     </div>
//   );
// };

// export default TermsAndPrivacy;

// src/pages/public/TermsAndPrivacy.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { 
  ScrollText, 
  ShieldCheck, 
  Info, 
  Phone, 
  MapPin, 
  Clock, 
  Mail, 
  Stethoscope, 
  CalendarCheck,
  Lock,
  Eye,
  FileText,
  AlertTriangle
} from "lucide-react"; 

const TermsAndPrivacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  // Added this function to handle click events on the links
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
            
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Group */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-slate-800">
              <span className="text-[#0099cc]">Buk</span>Care
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="hidden md:flex items-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide ml-60 pt-3 pb-3">
              <Link to="/" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>Home</Link>
              <Link to="/About" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>About</Link>
              <Link to="/Services" className="hover:text-[#00aeef] transition">Services</Link>
              <Link to="/Contact" className="hover:text-[#00aeef] transition">Contact</Link>
              {/* Highlighted Terms since we are on the Terms page */}
              <Link to="/Terms" className="text-[#00aeef]" onClick={handleScrollTop}>Terms of Services & Privacy Policy</Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative w-full h-auto min-h-[450px] bg-sky-50 overflow-hidden transition-all duration-500">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-sky-100 via-white to-sky-50 opacity-80 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center h-full pt-12 md:pt-0">
          
          {/* Left Text Content */}
          <div className="md:w-1/2 pt-10 md:pt-20 pb-20 md:pr-10">
            <h4 className="text-cyan-500 font-bold uppercase tracking-wider text-sm mb-2">
              Legal & Compliance
            </h4>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 leading-tight mb-6 transition-all duration-300">
              BukCare <br/> 
              <span className="text-slate-600">
                {activeTab === "terms" ? "Terms of Service" : "Privacy Policy"}
              </span>
            </h1>
            
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              {activeTab === "terms" 
                ? "Welcome to the BUKCARE system. By accessing or using this system, you agree to comply with these Terms. We are committed to operational integrity."
                : "Your privacy is paramount. This policy explains how we collect, use, and secure your data in compliance with HIPAA and the Data Privacy Act of 2012."
              }
            </p>

            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab("terms")}
                className={`py-3 px-6 rounded shadow-lg transition-all font-semibold ${activeTab === 'terms' ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
              >
                Terms of Use
              </button>
              <button 
                onClick={() => setActiveTab("privacy")}
                className={`py-3 px-6 rounded shadow-lg transition-all font-semibold ${activeTab === 'privacy' ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-white text-slate-600 hover:bg-gray-100'}`}
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Right Image Content */}
          <div className="md:w-1/2 h-full flex items-end justify-center md:justify-end relative">
             <div className="absolute bottom-0 right-10 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
             <img 
               src="./bukcare_logo.png" 
               alt="Medical Professional" 
               className="relative z-10 h-[350px] md:h-[500px] object-cover object-top mask-image-gradient"
             />
          </div>
        </div>
      </div>

      {/* 3. FEATURE CARDS STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-3 w-full ml-4">
        <div className="bg-sky-500 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-600 cursor-pointer" onClick={() => setActiveTab("privacy")}>
          <ShieldCheck className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-xl font-bold mb-3">HIPAA Compliance</h3>
          <p className="text-sky-100 text-sm leading-relaxed mb-4">
            We strictly follow HIPAA principles to protect patient health information (PHI). Your data is securely stored.
          </p>
          <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all">
            Read Privacy Policy
          </span>
        </div>

        <div className="bg-sky-400 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-500 cursor-pointer" onClick={() => setActiveTab("terms")}>
          <Stethoscope className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-xl font-bold mb-3">User Responsibilities</h3>
          <p className="text-sky-100 text-sm leading-relaxed mb-4">
            Provide accurate info, keep credentials secure, and use the system only for intended scheduling purposes.
          </p>
          <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all">
            View Guidelines
          </span>
        </div>

        <div className="bg-sky-300 text-white p-10 flex flex-col items-center text-center group transition-colors hover:bg-sky-400">
          <CalendarCheck className="w-12 h-12 mb-4 opacity-90" />
          <h3 className="text-xl font-bold mb-3">24/7 Scheduling</h3>
          <p className="text-sky-50 text-sm leading-relaxed mb-4">
            Centralized platform for managing appointments and receiving real-time automated notifications.
          </p>
          <span className="uppercase text-xs font-bold tracking-widest border-b border-transparent group-hover:border-white transition-all cursor-pointer">
            Book Now
          </span>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-grow py-16 px-4 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center gap-3 mb-12">
            {activeTab === "terms" ? <ScrollText className="w-8 h-8 text-cyan-500" /> : <Lock className="w-8 h-8 text-cyan-500" />}
            <h2 className="text-3xl font-bold text-gray-800">
              {activeTab === "terms" ? "Detailed Terms & Agreements" : "Data Privacy & Security Policy"}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column (Navigation) */}
            <div className="lg:col-span-1">
               <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-cyan-500 shadow-sm sticky top-10">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" /> Quick Navigation
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li 
                      onClick={() => setActiveTab("terms")}
                      className={`cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'terms' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}
                    >
                      • Terms of Use
                    </li>
                    <li 
                      onClick={() => setActiveTab("privacy")}
                      className={`cursor-pointer transition-colors flex items-center gap-2 ${activeTab === 'privacy' ? 'text-cyan-600 font-bold' : 'hover:text-cyan-600'}`}
                    >
                      • Privacy Policy (HIPAA)
                    </li>
                    <li className="text-gray-400 mt-4 pt-4 border-t border-gray-200 pointer-events-none">• Contact Details</li>
                  </ul>
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400">Effective Date: January 2025</p>
                    <p className="text-xs text-gray-400">Version: 1.0</p>
                  </div>
               </div>
            </div>

            {/* Right Column (Content Switcher) */}
            <div className="lg:col-span-2 space-y-10 text-gray-600 leading-relaxed animate-in fade-in duration-500">
              
              {activeTab === "terms" ? (
                /* ================= TERMS CONTENT ================= */
                <>
                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">1</span> 
                        Purpose of the System
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                        <li>Provide a centralized digital platform for scheduling, rescheduling, and managing appointments.</li>
                        <li>Allow doctors to update and manage their availability in real time.</li>
                        <li>Send automated email and SMS notifications to patients about appointment reminders and schedule changes.</li>
                        <li>Improve administrative efficiency and minimize manual scheduling errors.</li>
                      </ul>
                  </section>

                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">2</span> 
                        User Responsibilities
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                        <li>Provide accurate and truthful information during registration and booking.</li>
                        <li>Keep login credentials confidential and secure.</li>
                        <li>Notify hospital administration of any unauthorized access or data breach.</li>
                        <li>Use the system only for its intended purpose and refrain from misuse, modification, or disruption.</li>
                      </ul>
                  </section>

                  <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                        3. Data Privacy Overview
                      </h3>
                      <p className="mb-4 text-blue-800">This System follows HIPAA principles to protect patient health information (PHI):</p>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded shadow-sm"><strong>Data Collection:</strong> Basic personal/contact info.</div>
                        <div className="bg-white p-3 rounded shadow-sm"><strong>Use of Data:</strong> Scheduling & communication only.</div>
                        <div className="bg-white p-3 rounded shadow-sm"><strong>Data Security:</strong> Securely stored & access controlled.</div>
                        <div className="bg-white p-3 rounded shadow-sm"><strong>Confidentiality:</strong> No sharing without consent.</div>
                      </div>
                      <p 
                        className="mt-4 font-medium text-blue-900 text-sm italic cursor-pointer hover:underline"
                        onClick={() => setActiveTab("privacy")}
                      >
                        Click here to read the full Privacy Policy.
                      </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">4</span> 
                       System Availability and Limitations
                     </h3>
                    <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                      <li>The system depends on stable internet and may experience downtime for maintenance or technical issues.</li>
                      <li>Doctor availability depends on manual updates and may sometimes be inaccurate.</li>
                      <li>The hospital and developers are not liable for missed appointments or delays from connectivity issues.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">5</span> 
                       Intellectual Property
                     </h3>
                    <p>All system content, code, and design are protected by copyright and intellectual property laws. Users cannot copy, distribute, or modify any part without prior authorization.</p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 text-sm font-bold">6</span> 
                       Consent to Communication
                     </h3>
                    <p className="mb-2">By registering, users agree to receive email/SMS notifications for:</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                       <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">Reminders</span>
                       <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">Availability Updates</span>
                       <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">System Alerts</span>
                    </div>
                  </section>

                  <div className="border-t border-gray-200 pt-8 mt-8">
                     <h3 className="text-lg font-bold text-gray-800 mb-2">Disclaimer</h3>
                     <p className="text-sm text-gray-500 mb-6">
                       The system is developed for academic and hospital improvement purposes. The hospital and developers are not responsible for damages or losses due to misuse, errors, or downtime. The system does not provide medical advice.
                     </p>

                     <h3 className="text-lg font-bold text-gray-800 mb-2">User Acknowledgment</h3>
                     <p className="text-sm text-gray-500">
                       By using the System, users confirm they have read, understood, and agreed to these Terms and Conditions. Violations may result in access suspension, termination, or legal action.
                     </p>
                  </div>
                </>
              ) : (
                /* ================= PRIVACY CONTENT ================= */
                <>
                  <p className="text-gray-500 italic mb-6">
                    The BUKCARE system respects your privacy and is committed to protecting personal and health-related information. This Privacy Policy explains how we collect, use, and secure your data in compliance with <strong>HIPAA</strong> and the <strong>Data Privacy Act of 2012 (RA 10173)</strong> of the Philippines.
                  </p>

                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-600" />
                        Information We Collect
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                        <li><strong>Personal Information:</strong> Full name, contact details, date of birth.</li>
                        <li><strong>Appointment Details:</strong> Doctor’s name, date, purpose of consultation.</li>
                        <li><strong>System Usage Data:</strong> Login history, device info, interaction records.</li>
                        <li><strong>Optional Medical Information:</strong> Brief reason for visit or follow-up purpose.</li>
                      </ul>
                  </section>

                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <Eye className="w-5 h-5 text-cyan-600" />
                        How We Use Your Information
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                        <li>Managing and scheduling appointments efficiently.</li>
                        <li>Sending automated reminders and updates.</li>
                        <li>Analyzing system usage for improvement and maintenance.</li>
                        <li>Facilitating secure communication between staff and patients.</li>
                      </ul>
                      <p className="mt-2 text-sm bg-yellow-50 p-2 border border-yellow-200 rounded text-yellow-800">
                        <AlertTriangle className="w-4 h-4 inline mr-1 mb-1"/> 
                        We do not sell or disclose your information to third parties for marketing purposes.
                      </p>
                  </section>

                  <section className="bg-green-50 p-6 rounded-lg border border-green-100">
                      <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-green-600" />
                        Data Storage and Security
                      </h3>
                      <ul className="grid md:grid-cols-2 gap-4">
                        <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
                          <strong>Encrypted Storage:</strong> All sensitive data is encrypted at rest and in transit.
                        </li>
                        <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
                          <strong>Access Control:</strong> Role-based access (RBAC) restricts data to authorized staff only.
                        </li>
                        <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
                          <strong>Secure Connection:</strong> We use HTTPS protocols for all communications.
                        </li>
                        <li className="bg-white p-3 rounded shadow-sm text-sm text-green-800">
                          <strong>Backups:</strong> Periodic backups ensure data integrity.
                        </li>
                      </ul>
                  </section>

                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold">?</span>
                        Data Retention & Deletion
                      </h3>
                      <p className="mb-2">Data is retained only as long as necessary for the fulfillment of the purposes for which it was obtained or for the establishment, exercise or defense of legal claims, or for legitimate business purposes, or as provided by law.</p>
                      <ul className="list-disc pl-5 space-y-2 marker:text-cyan-500">
                        <li>Users may request correction, deletion, or deactivation of accounts.</li>
                        <li>Deleted data is permanently removed after the retention period.</li>
                      </ul>
                  </section>

                  <section>
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 text-xs font-bold">!</span>
                        Your Rights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
                            <h5 className="font-bold text-cyan-700">Right to Access</h5>
                            <p className="text-sm">Request a copy of your personal info.</p>
                          </div>
                          <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
                            <h5 className="font-bold text-cyan-700">Right to Correct</h5>
                            <p className="text-sm">Update inaccurate records.</p>
                          </div>
                          <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
                            <h5 className="font-bold text-cyan-700">Right to Withdraw</h5>
                            <p className="text-sm">Withdraw consent or restrict processing.</p>
                          </div>
                          <div className="p-4 border border-gray-100 rounded-lg hover:border-cyan-200 transition-colors">
                            <h5 className="font-bold text-cyan-700">Right to Complain</h5>
                            <p className="text-sm">File complaints with the project team.</p>
                          </div>
                      </div>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Cookies and Third-Party Services</h3>
                    <p className="mb-4">
                      You may disable cookies, but some features may not work properly. If the system integrates third-party APIs (SMS, email), these services are vetted to comply with HIPAA and Data Privacy Act standards.
                    </p>
                  </section>
                </>
              )}

              {/* Section 10: Contact Information (Shared) */}
              <div className="bg-slate-800 text-slate-300 p-8 rounded-xl mt-8">
                 <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                   <Info className="w-5 h-5 text-cyan-400"/> Contact Information
                 </h3>
                 <p className="mb-6 text-sm">
                    {activeTab === 'terms' ? 'For inquiries regarding these Terms:' : 'For privacy concerns, data access requests, or reporting unauthorized use:'}
                 </p>
                 <div className="grid md:grid-cols-2 gap-8">
                   <div>
                      <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">System Proponents</p>
                      <p className="font-semibold text-white">Capstone Project Team</p>
                      <p className="mt-4 text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2">Institution</p>
                      <p className="text-white">Central Mindanao University</p>
                      <p className="text-sm">Musuan, Maramag, Bukidnon, Philippines</p>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-cyan-400 mt-1" />
                        <div>
                           <p className="text-xs text-gray-400 uppercase">Email Us</p>
                           <p className="text-white">bukcare.project@gmail.com</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-cyan-400 mt-1" />
                        <div>
                           <p className="text-xs text-gray-400 uppercase">Call Us</p>
                           <p className="text-white">+63 912 345 6789</p>
                        </div>
                     </div>
                   </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndPrivacy;