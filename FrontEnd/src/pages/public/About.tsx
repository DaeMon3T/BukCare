// src/pages/public/About.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer"; // ✅ Make sure this exists

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 text-white">
      {/* Navigation */}
      <nav className="p-6">
        <Link to="/" className="text-yellow-300 hover:text-white font-semibold">
          ← Back to Home
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          About <span className="text-yellow-300">BukCare</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed">
          Revolutionizing healthcare accessibility through innovative digital solutions
        </p>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-6 bg-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg">
            Our Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                Transforming Healthcare Access
              </h3>
              <p className="text-lg leading-relaxed mb-6">
                BukCare was founded with a simple yet powerful vision: to make
                quality healthcare accessible to everyone, everywhere. We believe
                that booking a medical appointment should be as simple as ordering
                food or booking a ride.
              </p>
              <p className="text-lg leading-relaxed">
                Through our innovative platform, we connect patients with trusted
                healthcare providers, eliminating barriers and reducing wait times
                while maintaining the highest standards of care.
              </p>
            </div>
            <div className="bg-white/20 p-8 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-4">Our Values</h4>
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

      {/* Impact Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg">
          Our Impact
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto text-center">
          <div className="bg-white/20 p-8 rounded-2xl shadow-lg">
            <h3 className="text-3xl font-bold mb-3">10,000+</h3>
            <p>Patients Served</p>
          </div>
          <div className="bg-white/20 p-8 rounded-2xl shadow-lg">
            <h3 className="text-3xl font-bold mb-3">500+</h3>
            <p>Verified Doctors</p>
          </div>
          <div className="bg-white/20 p-8 rounded-2xl shadow-lg">
            <h3 className="text-3xl font-bold mb-3">50+</h3>
            <p>Healthcare Facilities</p>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 px-6 bg-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12 drop-shadow-lg">
            Built for the Future
          </h2>
          <p className="text-lg mb-8 max-w-3xl mx-auto">
            BukCare leverages cutting-edge technology to provide a seamless,
            secure, and reliable healthcare booking experience. Our platform is
            built with modern web technologies and follows best practices for
            data security and privacy.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/20 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Secure & Reliable</h3>
              <p>
                End-to-end encryption and HIPAA-compliant data handling ensure
                your medical information stays private and secure.
              </p>
            </div>
            <div className="bg-white/20 p-6 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Always Available</h3>
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
        <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">
          Join the BukCare Community
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg">
          Experience the future of healthcare booking today.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-yellow-400 text-gray-900 font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-yellow-300 hover:scale-105 transform transition duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/services"
            className="bg-white text-blue-600 font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-gray-100 hover:scale-105 transform transition duration-300"
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
