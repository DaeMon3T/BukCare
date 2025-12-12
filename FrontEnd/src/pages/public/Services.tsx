// src/pages/public/Services.tsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Services: React.FC = () => {
  // Ensure page starts at top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Added this function to handle click events on the new links
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans">
      
      {/* Navigation (Matches white header) */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
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
              {/* Highlighted Services since we are on the Services page */}
              <Link to="/Services" className="text-[#00aeef] transition" onClick={handleScrollTop}>Services</Link>
              <Link to="/Contact" className="hover:text-[#00aeef] transition">Contact</Link>
              <Link to="/Terms" className="hover:text-[#00aeef] transition">Terms of Services & Privacy Policy</Link>
          </div>
      
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center bg-gray-50 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-right md:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')"
          }}
        >
          {/* Gentle Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-xl">
             <span className="text-[#0099cc] font-medium tracking-wide mb-2 block">
               
             </span>
             <h1 className="text-5xl font-bold text-slate-800 mb-6 leading-tight">
               Our <br />
               Healthcare <span className="text-slate-700">Services</span>
             </h1>
             <p className="text-lg text-slate-500 mb-8 leading-relaxed">
               Comprehensive healthcare solutions designed to meet all your medical needs.
               Lorem ipsum dolor sit amet, consectetuer adipiscing elit.
             </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-20 -mt-20 mx-auto max-w-7xl px-4 md:px-0">
        <div className="grid md:grid-cols-3 text-white shadow-xl">
          {[
            {
              step: "1️⃣",
              title: "Create Account",
              desc: "Sign up with your email and complete your medical profile securely",
              color: "bg-[#2dbce0]" // Light Blue
            },
            {
              step: "2️⃣",
              title: "Find Your Doctor",
              desc: "Search by specialty, location, availability, and patient reviews",
              color: "bg-[#0099cc]" // Medium Blue
            },
            {
              step: "3️⃣",
              title: "Book Instantly",
              desc: "Choose your preferred time slot and get instant confirmation",
              color: "bg-[#007aa3]" // Darker Blue
            },
          ].map((item, index) => (
            <div
              key={index}
              className={`${item.color} p-10 text-center transition hover:brightness-110`}
            >
              <div className="text-4xl mb-4 opacity-80">{item.step}</div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">{item.title}</h3>
              <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
           <span className="text-xs text-gray-400 uppercase tracking-widest">How it works</span>
        </div>
      </section>

      {/* Medical Specialties Section */}
      <section id="specialties" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-800 mb-4">Medical Specialties Available</h2>
             <div className="h-1 w-16 bg-[#0099cc] mx-auto"></div>
           </div>
           
           <div className="grid md:grid-cols-4 gap-8">
             {[
               { emoji: "🩺", title: "General Practice", desc: "Primary healthcare and routine checkups" },
               { emoji: "❤️", title: "Cardiology", desc: "Heart and cardiovascular system care" },
               { emoji: "🧠", title: "Neurology", desc: "Brain and nervous system disorders" },
               { emoji: "🦴", title: "Orthopedics", desc: "Bone, joint, and muscle treatment" },
               { emoji: "👁️", title: "Ophthalmology", desc: "Eye care and vision treatment" },
               { emoji: "🩸", title: "Dermatology", desc: "Skin, hair, and nail conditions" },
               { emoji: "🤱", title: "Pediatrics", desc: "Specialized care for children" },
               { emoji: "🏥", title: "Emergency Care", desc: "Urgent medical attention" },
             ].map((spec, index) => (
               <div
                 key={index}
                 className="group bg-white p-6 border border-gray-100 rounded hover:shadow-xl transition duration-300 text-center"
               >
                 <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{spec.emoji}</div>
                 <h3 className="font-bold text-lg mb-2 text-slate-700 group-hover:text-[#0099cc] transition-colors">{spec.title}</h3>
                 <p className="text-sm text-gray-500 leading-relaxed">{spec.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#f9f9f9]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-800">
              Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-12 ml-50">
            <div>
              <h3 className="text-xl font-bold mb-6 text-[#0099cc] border-b pb-2 border-gray-200">For Patients</h3>
              {[
                { title: "Online Booking", desc: "Schedule appointments 24/7 from any device" },
                { title: "Appointment Reminders", desc: "Never miss an appointment with automated notifications" },
                { title: "Doctor Reviews", desc: "Read patient feedback to choose the right doctor" },
              ].map((feature, index) => (
                <div key={index} className="flex gap-4 mb-6">
                  <div className="min-w-[4px] bg-[#0099cc] h-full rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-slate-700">{feature.title}</h4>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-[#0099cc] border-b pb-2 border-gray-200">For Healthcare Providers</h3>
              {[
                { title: "Schedule Management", desc: "Efficiently manage your appointment calendar" },
                { title: "Patient Database", desc: "Secure access to patient information and history" },
                { title: "Secure Communication", desc: "HIPAA-compliant messaging with patients" },
              ].map((feature, index) => (
                <div key={index} className="flex gap-4 mb-6">
                  <div className="min-w-[4px] bg-[#0099cc] h-full rounded-full"></div>
                  <div>
                    <h4 className="font-bold text-slate-700">{feature.title}</h4>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center bg-white border-t border-gray-100">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">
          Ready to Experience Better Healthcare?
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg text-gray-500">
          Join thousands of patients who have simplified their healthcare journey with BukCare.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-[#0099cc] text-white font-bold px-8 py-3 rounded-sm shadow hover:bg-[#0088b5] transition duration-300 uppercase text-sm tracking-wide"
          >
            Start Booking
          </Link>
          <Link
            to="/contact"
            className="bg-white text-slate-700 border border-gray-300 font-bold px-8 py-3 rounded-sm hover:bg-gray-50 transition duration-300 uppercase text-sm tracking-wide"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;