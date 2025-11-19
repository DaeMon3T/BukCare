
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PatientInterface: React.FC = () => {
  return (
    <div className="relative flex flex-col min-h-screen font-sans text-slate-800">
      
      {/* --- BACKGROUND VIDEO START --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Ensure the video file is placed in your public folder */}
          <source src="/Bukcare-video-bg.mp4" type="video/mp4" />
        </video>
        
        {/* BRAND OVERLAY: Changed from white to Deep Navy Blue (#002B5B) 
            High opacity (90%) ensures text legibility while keeping the video as a subtle animated texture. */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#002B5B]/80 mix-blend-multiply"></div>
      </div>
      {/* --- BACKGROUND VIDEO END --- */}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="relative z-10 flex flex-col flex-grow w-full">
        {/* Navbar */}
        <Navbar role="patient" />

        {/* Main content */}
        <main className="flex-grow h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Hero Section - Matches the "Your Time, Your Health" section */}
            <div className="mb-8">
              <div className="bg-transparent p-2">
                {/* Yellow Accent for the Heading to match 'Scheduled with Care' */}
                <h1 className="text-2xl md:text-4xl font-bold mb-2 text-[#FFC107]">
                  Welcome back!
                </h1>
                <p className="text-blue-50 text-10 max-w-2xl">
                  Here's your health dashboard. Use the navigation to book appointments, view your schedule, and manage your profile.
                </p>
              </div>
            </div>

            {/* Dashboard cards - Matches the "How it Works?" white card style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-5 bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-b-4 border-[#FFC107]">
                <h2 className="text-15 font-bold text-[#002B5B] mb-3">
                  Appointments
                </h2>
                <p className="text-gray-600 mb-4">
                  View your upcoming appointments and manage bookings.
                </p>
                <span className="text-[#002B5B] font-semibold text-sm hover:underline cursor-pointer">
                  View Schedule &rarr;
                </span>
              </div>

              {/* Card 2 */}
              <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-b-4 border-[#FFC107]">
                <h2 className="text-15 font-bold text-[#002B5B] mb-3">
                  Health Records
                </h2>
                <p className="text-gray-600 mb-4">
                  Check your medical history, prescriptions, and test results.
                </p>
                <span className="text-[#002B5B] font-semibold text-sm hover:underline cursor-pointer">
                  View Records &rarr;
                </span>
              </div>

              {/* Card 3 */}
              <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-b-4 border-[#FFC107]">
                <h2 className="text-15 font-bold text-[#002B5B] mb-3">
                  Notifications
                </h2>
                <p className="text-gray-600 mb-4">
                  See alerts, reminders, and important updates about your health.
                </p>
                <span className="text-[#002B5B] font-semibold text-sm hover:underline cursor-pointer">
                  Check Alerts &rarr;
                </span>
              </div>

            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default PatientInterface;