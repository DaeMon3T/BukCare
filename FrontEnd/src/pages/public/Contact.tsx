import React, { useState, useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  Menu, 
  X,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import Footer from "@/components/Footer";
import logo from "@/assets/images/icon_logo_name.png"

gsap.registerPlugin(ScrollTrigger);

const Contact: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        alert("Thank you! Your message has been sent.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setIsSubmitting(false);
    }, 1500);
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Animations
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
        // Hero Reveal
        const heroTl = gsap.timeline();
        heroTl.fromTo(".hero-item",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
        );

        // Contact Cards Stagger
        gsap.fromTo(".contact-card",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".contact-grid",
                    start: "top 85%",
                }
            }
        );

        // Form & Map Slide-in
        gsap.fromTo(".form-section",
            { x: -30, opacity: 0 },
            {
                x: 0, opacity: 1, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: ".main-content", start: "top 75%" }
            }
        );

        gsap.fromTo(".map-section",
            { x: 30, opacity: 0 },
            {
                x: 0, opacity: 1, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: ".main-content", start: "top 75%" }
            }
        );

    }, containerRef);

    return () => {
        ctx.revert();
        lenis.destroy();
    };
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Terms of Services", path: "/Terms" },
    { name: "Privacy Policy", path: "/Privacy" },
  ];

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden">
      
      {/* --- 1. NAVIGATION --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                    {/* Logo */}
                    <img 
                        src={logo} 
                        className="h-25 md:h-30 lg:h-35 w-auto object-contain transition-all duration-300" 
                        alt="BukCare Logo" 
                    />
                </div>
            </Link>

          <div className="hidden md:flex items-center gap-8">
             {navLinks.map((link) => (
                <Link 
                    key={link.name}
                    to={link.path} 
                    onClick={handleScrollTop}
                    className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                        location.pathname === link.path 
                        ? "text-[#00aeef]" 
                        : "text-slate-500 hover:text-[#00aeef]"
                    }`}
                >
                    {link.name}
                </Link>
             ))}
          </div>

          <button className="md:hidden text-slate-600 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                    <Link 
                        key={link.name} 
                        to={link.path} 
                        onClick={handleScrollTop}
                        className="text-lg font-medium text-slate-700 hover:text-[#00aeef]"
                    >
                        {link.name}
                    </Link>
                ))}
            </div>
        </div>
      </nav>

      {/* --- 2. HERO SECTION (Upgraded) --- */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 px-6 overflow-hidden bg-slate-50/50">
         
         {/* 1. Technical Grid Background (Adds structure) */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white"></div>

         <div className="max-w-4xl mx-auto text-center relative z-10">
            
            {/* 2. Live Status Badge (Pulse Animation) */}
            <div className="hero-item inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold uppercase tracking-widest mb-8 shadow-sm hover:shadow-md transition-shadow cursor-default">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-slate-600">Support Team Online</span>
            </div>
            
            {/* 3. Massive Typography */}
            <h1 className="hero-item text-6xl lg:text-8xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tighter">
                Let's Start a <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Conversation.</span>
            </h1>
            
            <p className="hero-item text-xl text-slate-500 mb-12 leading-relaxed max-w-xl mx-auto font-medium">
                Have questions about our services or need help booking an appointment? We are ready to assist you.
            </p>
         </div>
         
         {/* 4. Floating Decorative Icons (Adds depth) */}
         {/* Left: Email */}
         <div className="hidden lg:flex absolute top-1/3 left-[10%] bg-white p-4 rounded-2xl shadow-xl shadow-blue-100/50 border border-slate-100 animate-float opacity-80 rotate-[-6deg]">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#00aeef]">
                <Mail className="w-5 h-5" />
            </div>
         </div>

         {/* Right: Phone */}
         <div className="hidden lg:flex absolute top-1/4 right-[10%] bg-white p-4 rounded-2xl shadow-xl shadow-blue-100/50 border border-slate-100 animate-float-delayed opacity-80 rotate-[6deg]">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                <Phone className="w-5 h-5" />
            </div>
         </div>

         {/* Bottom: Chat */}
         <div className="hidden lg:flex absolute bottom-20 left-[20%] bg-white p-3 rounded-2xl shadow-lg shadow-purple-100/50 border border-slate-100 animate-float opacity-60 rotate-[12deg]">
             <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500">
                <MessageSquare className="w-4 h-4" />
            </div>
         </div>
      </section>

      {/* Add this CSS to your index.css or a <style> tag for the float animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-15px) rotate(-6deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(6deg); }
          50% { transform: translateY(-15px) rotate(6deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite; animation-delay: 2s; }
      `}</style>

      {/* --- 3. CONTACT INFO GRID --- */}
      <section className="px-6 -mt-10 relative z-20">
        <div className="max-w-7xl mx-auto">
            <div className="contact-grid grid md:grid-cols-3 gap-6">
                
                {/* Location */}
                <div className="contact-card bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-14 h-14 bg-blue-50 text-[#00aeef] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <MapPin className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Visit Us</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Bukidnon Provincial Hospital (BPH)<br/>
                        Maramag, Bukidnon
                    </p>
                </div>

                {/* Phone */}
                <div className="contact-card bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Phone className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Call Us</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Mon-Fri from 8am to 5pm<br/>
                        <span className="font-bold text-slate-700">+63 (912) 345-6789</span>
                    </p>
                </div>

                {/* Email */}
                <div className="contact-card bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 group hover:-translate-y-2 transition-transform duration-300">
                    <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Mail className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Support Team<br/>
                        <span className="font-bold text-slate-700">support@bukcare.app</span>
                    </p>
                </div>

            </div>
        </div>
      </section>

      {/* --- 4. MAIN CONTENT (Form & Map) --- */}
      <section className="main-content py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
            
            {/* Left: Contact Form */}
            <div className="form-section">
                <div className="mb-10">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Send us a Message</h2>
                    <div className="h-1.5 w-16 bg-[#00aeef] rounded-full"></div>
                    <p className="text-slate-500 mt-6">
                        We usually respond within 24 hours. For medical emergencies, please dial 911 immediately.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Name</label>
                            <input 
                                type="text" 
                                required
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Email</label>
                            <input 
                                type="email" 
                                required
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Subject</label>
                        <input 
                            type="text" 
                            required
                            placeholder="Appointment Inquiry"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">Message</label>
                        <textarea 
                            required
                            rows={5}
                            placeholder="How can we help you?"
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] focus:border-transparent outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-10 py-4 bg-[#00aeef] text-white font-bold rounded-xl shadow-lg hover:bg-[#009bd5] hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            "Sending..."
                        ) : (
                            <>Send Message <Send className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
            </div>

            {/* Right: Map & FAQ */}
            <div className="map-section space-y-12">
                
                {/* Map */}
                <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 h-[400px] relative group">
                    <iframe 
                        title="BPH Maramag Map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3950.485304627196!2d125.00627797405628!3d7.755452207196023!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32ff3b3e3e007d4d%3A0xc3f7a2d8e3b1c6d!2sBukidnon%20Provincial%20Hospital%20-%20Maramag!5e0!3m2!1sen!2sph!4v1709650000000!5m2!1sen!2sph" 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, filter: "grayscale(100%) contrast(1.2)" }} 
                        allowFullScreen 
                        loading="lazy"
                        className="group-hover:filter-none transition-all duration-700"
                    ></iframe>
                    {/* Hover Hint */}
                    <div className="absolute inset-0 bg-slate-900/10 pointer-events-none group-hover:bg-transparent transition-colors"></div>
                </div>

                {/* FAQ Mini */}
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <HelpCircle className="w-6 h-6 text-[#00aeef]" /> Common Questions
                    </h3>
                    <div className="space-y-4">
                        {[
                            { q: "How do I cancel an appointment?", a: "Go to your dashboard and select 'My Appointments'. You can cancel up to 2 hours before." },
                            { q: "Do you accept insurance?", a: "Yes, we accept PhilHealth and most major HMOs. Please verify with the hospital desk." },
                            { q: "Is the clinic open on weekends?", a: "Emergency services are 24/7. Outpatient clinics operate Mon-Sat, 8am-5pm." }
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                                <h4 className="font-bold text-slate-800 mb-2">{item.q}</h4>
                                <p className="text-sm text-slate-500">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;