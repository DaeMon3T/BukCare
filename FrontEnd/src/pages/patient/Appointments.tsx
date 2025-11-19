// // src/pages/patient/Appointments.tsx
// import Navbar from '@/components/Navbar';

// export default function Appointments(): JSX.Element {
//   return (
//     <div>
//       <Navbar role="patient" />
//       <h1 className="text-2xl font-bold mt-4">Patient Appointments</h1>
//       <p>See your scheduled appointments.</p>
//     </div>
//   );
// }

// // src/pages/patient/Appointments.tsx
import Navbar from '@/components/Navbar';

export default function Appointments(): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* VIDEO BACKGROUND START */}
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          {/* Ensure the file name matches exactly what is in your public folder */}
          <source src="/Bukcare-video-bg.mp4" type="video/mp4" />
        </video>
        {/* Overlay: Adjust opacity (bg-white/70) if you want the video to be more or less visible */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#002B5B]/80 mix-blend-multiply"></div>
      </div>
      {/* VIDEO BACKGROUND END */}

      <Navbar role="patient" />

      {/* Main Content */}
      <div className="relative max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-[#F5CC00] mt-11 ml-78">Patient Appointments</h1>
        <p className="mt-2 text-white text-xs ml-87">See your scheduled appointments.</p>
        
        {/* Content placeholder - you can add your appointment list/cards here later */}
        <div className="mt-10 bg-white/50 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-black">No appointments scheduled yet.</p>
        </div>
      </div>
    </div>
  );
}