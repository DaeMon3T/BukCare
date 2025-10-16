// src/pages/public/Landing.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer.js";

const IconCalendar: React.FC = () => {
  return (
    <svg
      className="w-8 h-8 mx-auto mb-3 text-sky-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4m8-4v4" />
    </svg>
  );
};

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
        <Link
          to="/"
          className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow"
        >
          BukCare
        </Link>
        <div className="space-x-6">
          <Link to="/signin" className="hover:underline">
            Sign In
          </Link>
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-24 gap-10 text-center">
        <h1 className="text-5xl font-extrabold mb-4 drop-shadow-xl">
          Book <span className="text-[#FFC43D]">Trusted Medical</span>{" "}
          Appointments Instantly
        </h1>
        <p className="mb-8 text-lg max-w-xl text-white/90">
          Fast, secure, and hassle-free scheduling. Take control of your
          healthcare whenever needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <Link
            to="/appointment"
            className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-10 py-3 rounded-full shadow-lg hover:bg-[#FFD84C] transition"
          >
            Book Appointment
          </Link>
          <Link
            to="/about"
            className="border-2 border-white/70 px-10 py-3 rounded-full hover:bg-white/20 transition text-white"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Why BukCare */}
      <section className="py-16 px-6 bg-white/10">
        <h2 className="text-3xl font-bold text-center mb-10 drop-shadow-lg">
          Why Choose BukCare?
        </h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto text-center">
          <div className="bg-white/30 p-7 rounded-2xl shadow-lg">
            <IconCalendar />
            <h3 className="font-semibold mb-1 text-[#0057B8]">Instant Booking</h3>
            <p className="text-[#1A1A40]">Book in seconds, skip the wait.</p>
          </div>
          <div className="bg-white/30 p-7 rounded-2xl shadow-lg">
            <svg
              className="w-8 h-8 mx-auto mb-3 text-sky-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6l4 2"
              />
            </svg>
            <h3 className="font-semibold mb-1 text-[#0057B8]">24/7 Access</h3>
            <p className="text-[#1A1A40]">Anytime, from any device.</p>
          </div>
          <div className="bg-white/30 p-7 rounded-2xl shadow-lg">
            <svg
              className="w-8 h-8 mx-auto mb-3 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h3 className="font-semibold mb-1 text-[#0057B8]">
              Trusted Professionals
            </h3>
            <p className="text-[#1A1A40]">Only certified, top-rated doctors.</p>
          </div>
          <div className="bg-white/30 p-7 rounded-2xl shadow-lg">
            <svg
              className="w-8 h-8 mx-auto mb-3 text-[#FFC43D]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect width={18} height={14} x={3} y={5} rx={2} strokeWidth={2} />
            </svg>
            <h3 className="font-semibold mb-1 text-[#0057B8]">
              Secure & Private
            </h3>
            <p className="text-[#1A1A40]">Your privacy is our priority.</p>
          </div>
        </div>
      </section>

      {/* Navigation Shortcuts */}
      <section className="py-16 px-6 bg-white/10">
        <h2 className="text-3xl font-bold text-center mb-10 drop-shadow-lg">
          Find Out More
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          {[
            { to: "/about", title: "About Us", desc: "Our mission & values" },
            { to: "/services", title: "Services", desc: "All specialties" },
            { to: "/contact", title: "Contact", desc: "We're here to help" },
          ].map((link, i) => (
            <Link
              key={i}
              to={link.to}
              className="bg-white/30 p-7 rounded-2xl shadow-lg hover:scale-105 transition block text-[#1A1A40]"
            >
              <h3 className="font-semibold mb-2 text-[#0057B8]">
                {link.title}
              </h3>
              <p>{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6 drop-shadow-lg">
          Ready for a Better Health Journey?
        </h2>
        <p className="mb-8 text-lg max-w-xl mx-auto text-white/80">
          Join BukCare and manage your appointments effortlessly, securely, and
          at your convenience.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-10 py-3 rounded-full shadow-xl hover:bg-[#FFD84C] transition"
          >
            Sign Up Now
          </Link>
          <Link
            to="/signin"
            className="bg-white text-[#0057B8] font-semibold px-10 py-3 rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            Sign In
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
