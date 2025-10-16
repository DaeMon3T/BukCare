// src/pages/public/Services.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Services: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navigation */}
      <nav className="p-6">
        <Link to="/" className="text-[#FFC43D] hover:text-white font-semibold">
          ← Back to Home
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Our <span className="text-[#FFC43D]">Healthcare Services</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed text-white/90">
          Comprehensive healthcare solutions designed to meet all your medical needs
        </p>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#0057B8]">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto text-center">
          {[
            {
              step: "1️⃣",
              title: "Create Account",
              desc: "Sign up with your email and complete your medical profile securely",
            },
            {
              step: "2️⃣",
              title: "Find Your Doctor",
              desc: "Search by specialty, location, availability, and patient reviews",
            },
            {
              step: "3️⃣",
              title: "Book Instantly",
              desc: "Choose your preferred time slot and get instant confirmation",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white/30 p-8 rounded-2xl shadow-lg hover:scale-105 transform transition duration-300 text-[#1A1A40]"
            >
              <div className="text-3xl mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Specialties Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
          Medical Specialties Available
        </h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
              className="bg-white/30 p-6 rounded-2xl shadow-lg text-center hover:scale-105 transform transition duration-300 text-[#1A1A40]"
            >
              <div className="text-3xl mb-3">{spec.emoji}</div>
              <h3 className="font-semibold mb-2 text-[#0057B8]">{spec.title}</h3>
              <p className="text-sm">{spec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
          Platform Features
        </h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-[#0057B8]">For Patients</h3>
            {[
              { title: "Online Booking", desc: "Schedule appointments 24/7 from any device" },
              { title: "Appointment Reminders", desc: "Never miss an appointment with automated notifications" },
              { title: "Doctor Reviews", desc: "Read patient feedback to choose the right doctor" },
            ].map((feature, index) => (
              <div key={index} className="bg-white/30 p-4 rounded-xl mb-4 text-[#1A1A40]">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6 text-[#0057B8]">For Healthcare Providers</h3>
            {[
              { title: "Schedule Management", desc: "Efficiently manage your appointment calendar" },
              { title: "Patient Database", desc: "Secure access to patient information and history" },
              { title: "Secure Communication", desc: "HIPAA-compliant messaging with patients" },
            ].map((feature, index) => (
              <div key={index} className="bg-white/30 p-4 rounded-xl mb-4 text-[#1A1A40]">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 drop-shadow-lg text-[#FFC43D]">
          Ready to Experience Better Healthcare?
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg text-white/90">
          Join thousands of patients who have simplified their healthcare journey with BukCare.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-[#FFD84C] hover:scale-105 transform transition duration-300"
          >
            Start Booking
          </Link>
          <Link
            to="/contact"
            className="bg-white text-[#0057B8] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-gray-100 hover:scale-105 transform transition duration-300"
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
