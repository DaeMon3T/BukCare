// src/pages/public/About.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const About: React.FC = () => {
  
  // Added this function to handle the onClick event in your new links
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-700 font-sans">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Group */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-slate-800">
              <span className="text-[#0099cc]">Buk</span>Care
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="hidden md:flex items-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide ml-20 pt-3 pb-3">
              <Link to="/" className="text-[#00aeef]" onClick={handleScrollTop}>Home</Link>
              <Link to="/About" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>About</Link>
              <Link to="/Services" className="hover:text-[#00aeef] transition">Services</Link>
              <Link to="/Contact" className="hover:text-[#00aeef] transition">Contact</Link>
              <Link to="/Terms" className="hover:text-[#00aeef] transition">Terms of Services & Privacy Policy</Link>
          </div>
          {/* --- INSERTED CODE END --- */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          }}
        >
          {/* Light Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-xl pt-10">
            <span className="text-[#0099cc] font-bold tracking-wide uppercase text-sm mb-2 block">
              
            </span>
            <h1 className="text-5xl md:text-5xl font-bold text-slate-800 mb-6 leading-tight">
              About <br />
              <span className="text-slate-700">BukCare</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Revolutionizing healthcare accessibility through innovative digital solutions. 
              We are the best choice for your medical health care needs.
            </p>
          </div>
        </div>
      </section>

      {/* The 3 Colored Boxes Section */}
      <section id="mission" className="relative z-10 -mt-24 px-4 md:px-0 mt-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 text-white">
          
          {/* Card 1: Mission */}
          <div className="bg-[#0099cc] p-10 hover:bg-[#008fb3] transition duration-300">
            <div className="mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-4">Our Mission</h3>
            <p className="text-white/90 leading-relaxed mb-4 text-sm">
              Transforming Healthcare Access. BukCare was founded with a simple vision: 
              to make quality healthcare accessible to everyone, everywhere.
            </p>
            <p className="text-white/90 text-sm">
               We connect patients with trusted providers, eliminating barriers.
            </p>
          </div>

          {/* Card 2: Vision */}
          <div className="bg-[#4db8ff] p-10 hover:bg-[#42aaff] transition duration-300">
             <div className="mb-4">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
             </div>
            <h3 className="text-xl font-bold mb-4">Our Vision</h3>
            <p className="text-white/90 leading-relaxed text-sm">
              To become the leading platform that empowers individuals to take control of their health.
              We envision a future where booking a medical appointment is effortless, secure, and accessible 24/7.
            </p>
          </div>

          {/* Card 3: Values */}
          <div className="bg-[#80d4ff] p-10 hover:bg-[#73caff] transition duration-300">
            <div className="mb-4">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold mb-4">Our Values</h3>
            <ul className="space-y-2 text-sm text-white/90">
              <li>✓ Patient-Centered Care</li>
              <li>✓ Innovation & Technology</li>
              <li>✓ Accessibility for All</li>
              <li>✓ Trust & Security</li>
              <li>✓ Quality Healthcare</li>
            </ul>
          </div>

        </div>
      </section>

      {/* Technology & Content Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Built for the Future
            </h2>
            <div className="h-1 w-20 bg-[#0099cc] mx-auto mb-6"></div>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              BukCare leverages cutting-edge technology to provide a seamless,
              secure, and reliable healthcare booking experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-slate-50 p-8 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-4 text-[#0099cc]">Secure & Reliable</h3>
              <p className="text-slate-600 leading-relaxed">
                End-to-end encryption and HIPAA-compliant data handling ensure
                your medical information stays private and secure. Our platform follows best practices for data security.
              </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-4 text-[#0099cc]">Always Available</h3>
              <p className="text-slate-600 leading-relaxed">
                24/7 platform availability with real-time appointment updates and
                instant confirmations. Managing your health has never been easier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#f8f9fa] border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-slate-800">
            Join the <span className="text-[#0099cc]">BukCare</span> Community
          </h2>
          <p className="mb-10 text-lg text-slate-600">
            Experience the future of healthcare booking today. Simple, Secure, and Smart.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link
              to="/signup"
              className="bg-[#0099cc] text-white font-semibold px-10 py-3 rounded shadow hover:bg-[#0088b5] transform hover:-translate-y-1 transition duration-300"
            >
              Get Started
            </Link>
            <Link
              to="/services"
              className="bg-white text-slate-700 border border-gray-300 font-semibold px-10 py-3 rounded shadow-sm hover:bg-gray-50 transform hover:-translate-y-1 transition duration-300"
            >
              View Services
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;