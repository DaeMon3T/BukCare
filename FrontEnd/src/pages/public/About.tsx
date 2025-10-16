// src/pages/public/About.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const About: React.FC = () => {
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
          About <span className="text-[#FFC43D]">BukCare</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed text-white/90">
          Revolutionizing healthcare accessibility through innovative digital solutions
        </p>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
            Our Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-[#0057B8]">
                Transforming Healthcare Access
              </h3>
              <p className="text-lg leading-relaxed mb-6 text-[#1A1A40]">
                BukCare was founded with a simple yet powerful vision: to make
                quality healthcare accessible to everyone, everywhere. We believe
                that booking a medical appointment should be as simple as ordering
                food or booking a ride.
              </p>
              <p className="text-lg leading-relaxed text-[#1A1A40]">
                Through our innovative platform, we connect patients with trusted
                healthcare providers, eliminating barriers and reducing wait times
                while maintaining the highest standards of care.
              </p>
            </div>
            <div className="bg-white/30 p-8 rounded-2xl shadow-lg text-[#1A1A40]">
              <h4 className="text-xl font-semibold mb-4 text-[#0057B8]">Our Values</h4>
              <ul className="space-y-3">
                <li>✓ Patient-Centered Care</li>
                <li>✓ Innovation & Technology</li>
                <li>✓ Accessibility for All</li>
                <li>✓ Trust & Security</li>
                <li>✓ Quality Healthcare</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
          Our Vision
        </h2>
        <div className="max-w-4xl mx-auto text-center text-lg text-[#1A1A40]">
          <p className="mb-4">
            To become the leading platform that empowers individuals to take control of their health, 
            connecting them seamlessly with trusted medical professionals.
          </p>
          <p className="mb-4">
            We envision a future where booking a medical appointment is effortless, secure, 
            and accessible anytime, anywhere.
          </p>
          <p>
            BukCare strives to set the standard for digital healthcare innovation and patient satisfaction.
          </p>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 drop-shadow-lg text-[#FFC43D]">
            Built for the Future
          </h2>
          <p className="text-lg mb-8 max-w-3xl mx-auto text-[#1A1A40]">
            BukCare leverages cutting-edge technology to provide a seamless,
            secure, and reliable healthcare booking experience. Our platform is
            built with modern web technologies and follows best practices for
            data security and privacy.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/30 p-6 rounded-2xl shadow-lg text-[#1A1A40]">
              <h3 className="text-xl font-semibold mb-4 text-[#0057B8]">Secure & Reliable</h3>
              <p>
                End-to-end encryption and HIPAA-compliant data handling ensure
                your medical information stays private and secure.
              </p>
            </div>
            <div className="bg-white/30 p-6 rounded-2xl shadow-lg text-[#1A1A40]">
              <h3 className="text-xl font-semibold mb-4 text-[#0057B8]">Always Available</h3>
              <p>
                24/7 platform availability with real-time appointment updates and
                instant confirmations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 drop-shadow-lg text-[#FFC43D]">
          Join the BukCare Community
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg text-white/90">
          Experience the future of healthcare booking today.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-[#FFD84C] hover:scale-105 transform transition duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/services"
            className="bg-white text-[#0057B8] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-gray-100 hover:scale-105 transform transition duration-300"
          >
            View Services
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
