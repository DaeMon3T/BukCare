import React, { useState, useRef, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Added useLocation
import { Globe, Menu, X } from "lucide-react"; // Added Icons for Mobile Menu
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logo from "@/assets/images/icon_logo_name.png"
import preview from "@/assets/images/preview.png"

gsap.registerPlugin(ScrollTrigger);

// --- ICONS ---
const IconMapPin: React.FC = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconPhone: React.FC = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const IconCheck: React.FC = () => (
  <svg className="w-5 h-5 text-[#00aeef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

// Feature Icons
const IconStethoscope: React.FC = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 3.5c-3.038 0-5.5 2.462-5.5 5.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-3.038-2.462-5.5-5.5-5.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10.5v5c0 1.657 1.343 3 3 3h2c1.657 0 3-1.343 3-3v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 14.5c0 2.485 2.015 4.5 4.5 4.5S15 16.985 15 14.5" />
  </svg>
);

const IconEmergency: React.FC = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const IconTransplant: React.FC = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

// --- COMPONENT: FAQ ITEM ---
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-6 text-left focus:outline-none group"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-[#00aeef]' : 'text-slate-800'} group-hover:text-[#00aeef]`}>
          {question}
        </span>
        <span className={`text-2xl transition-transform duration-300 ${isOpen ? "rotate-45 text-[#00aeef]" : "text-gray-300"}`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 leading-relaxed text-sm">{answer}</p>
      </div>
    </div>
  );
};

// ===================================================================
// === MAIN LANDING COMPONENT ===
// ===================================================================
const Landing: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Navigation State & Hooks
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Terms of Services", path: "/Terms" },
    { name: "Privacy Policy", path: "/Privacy" },
  ];

  useLayoutEffect(() => {
    // GSAP CONTEXT: Scopes all animations to this component
    const ctx = gsap.context(() => {
        
        // 1. Hero Animations
        const heroTl = gsap.timeline();
        heroTl.from(".hero-text-element", {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
            delay: 0.2
        })
        .from(".hero-image-container", {
            x: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out"
        }, "-=0.8");

        // 2. Stats Animation
        gsap.fromTo(".stat-item", 
            { y: 30, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: ".stats-section",
                    start: "top 80%",
                }
            }
        );

        // 3. Feature Cards
        const cards = document.querySelectorAll(".feature-card");
        if(cards.length > 0) {
            gsap.fromTo(cards, 
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".features-grid",
                        start: "top 75%",
                    }
                }
            );
        }

        // 4. How It Works Steps
        const steps = document.querySelectorAll(".step-item");
        steps.forEach((step) => {
            gsap.fromTo(step, 
                { opacity: 0, x: -30 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: step,
                        start: "top 85%",
                    }
                }
            );
        });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-600 font-sans selection:bg-[#00aeef] selection:text-white overflow-x-hidden">
      
      {/* 1. NAVIGATION BAR (UPDATED) */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all duration-300">
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
        

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
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

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-600 p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
             {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="flex flex-col p-6 gap-4">
                {navLinks.map((link) => (
                    <Link 
                        key={link.name} 
                        to={link.path} 
                        onClick={handleScrollTop}
                        className={`text-lg font-medium hover:text-[#00aeef] ${
                            location.pathname === link.path ? "text-[#00aeef]" : "text-slate-700"
                        }`}
                    >
                        {link.name}
                    </Link>
                ))}
                <Link to="/signup" onClick={handleScrollTop} className="mt-2 w-full text-center bg-slate-900 text-white px-5 py-3 rounded-lg font-bold">
                    Book Appointment
                </Link>
            </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-[80px] z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
                <div className="hero-text-element inline-block px-3 py-1 bg-blue-100 text-[#0077a3] rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                    Healthcare Simplified
                </div>
                <h1 className="hero-text-element text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                    Your Health, <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">
                        Connected.
                    </span>
                </h1>
                <p className="hero-text-element text-slate-500 text-lg md:text-xl max-w-lg leading-relaxed mb-8">
                    Skip the waiting room. Book appointments, manage records, and connect with Bukidnon's top doctors—all in one app.
                </p>
                
                <div className="hero-text-element flex flex-col sm:flex-row gap-4">
                    <Link to="/signin" className="inline-flex justify-center items-center bg-[#00aeef] text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-500/20 hover:bg-[#009bd5] hover:shadow-blue-500/40 hover:-translate-y-1 transition-all">
                        Get Started
                    </Link>
                    <Link to="/about" className="inline-flex justify-center items-center px-8 py-4 rounded-xl text-slate-600 font-bold border border-slate-200 hover:border-[#00aeef] hover:text-[#00aeef] bg-white transition-all">
                        How it Works
                    </Link>
                </div>
                
                <div className="hero-text-element mt-8 flex items-center gap-4 text-sm text-slate-400 font-medium">
                    <p>Trusted by patients</p>
                </div>
            </div>

            {/* Right Content: Custom CSS Image Placeholder (App Dashboard Mockup) */}
            <div className="hero-image-container relative hidden md:block perspective-1000">
                <div className="relative w-full max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 p-4 transform rotate-y-12 rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
                    {/* Fake App Header */}
                    <div className="flex items-center justify-between px-4 mb-6 pt-2">
                         <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                         <div className="w-24 h-4 bg-slate-100 rounded-full"></div>
                         <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                    </div>
                    
                    {/* Fake Welcome Card */}
                    <div className="bg-[#00aeef] rounded-3xl p-6 mb-4 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                        <div className="w-32 h-6 bg-white/20 rounded-full mb-3"></div>
                        <div className="w-48 h-4 bg-white/20 rounded-full mb-6"></div>
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl"></div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl"></div>
                        </div>
                    </div>

                    {/* Fake Appointment List */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm"></div>
                                <div className="flex-1">
                                    <div className="w-24 h-4 bg-slate-200 rounded-full mb-2"></div>
                                    <div className="w-16 h-3 bg-slate-200 rounded-full"></div>
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-slate-200"></div>
                            </div>
                        ))}
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-50 flex items-center gap-3 animate-bounce-slow">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                            <IconCheck />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Status</p>
                            <p className="text-sm font-bold text-slate-800">Appointment Confirmed</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      

      {/* 3. FEATURE CARDS */}
      <div className="bg-slate-50 pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 max-w-2xl">
                 <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why Choose BukCare?</h2>
                 <p className="text-slate-500 text-lg">We simplify the healthcare experience so you can focus on getting better, not waiting in line.</p>
            </div>

            <div className="features-grid grid md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="feature-card bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-blue-100 group transition-all duration-300 hover:-translate-y-2">
                    <div className="w-14 h-14 bg-[#00aeef] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <IconStethoscope /> 
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Centralized Scheduling</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Replace manual booking methods with a digital system that allows patients to schedule appointments instantly.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="feature-card bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-blue-100 group transition-all duration-300 hover:-translate-y-2">
                      <div className="w-14 h-14 bg-[#2dc7f8] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                        <IconEmergency />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Alerts</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Get instant notifications via SMS or Email if a doctor’s schedule changes or if they become unavailable.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="feature-card bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-blue-100 group transition-all duration-300 hover:-translate-y-2">
                      <div className="w-14 h-14 bg-[#48c7f4] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sky-500/20 group-hover:scale-110 transition-transform">
                        <IconTransplant />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Live Availability</h3>
                    <p className="text-slate-500 leading-relaxed">
                        View a doctor's schedule and availability in real-time before booking to avoid conflicts.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* 4. HOW IT WORKS */}
      <section className="py-32 bg-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div>
                <span className="text-[#00aeef] font-bold text-sm tracking-widest uppercase mb-2 block">The Process</span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                    From booking to <br/> diagnosis in <span className="text-[#00aeef]">3 steps.</span>
                </h2>
                <p className="text-slate-500 text-lg mb-12">
                    We've streamlined the entire process to ensure you spend less time waiting and more time getting the care you need.
                </p>

                <div className="space-y-12 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100"></div>

                    {[
                        { title: "Create account", desc: "Sign up in less than 30 seconds. Free and secure." },
                        { title: "Select Doctor", desc: "Browse by specialty, location, or availability." },
                        { title: "Receive Treatment", desc: "Get your digital appointment card and visit the clinic." }
                    ].map((item, index) => (
                        <div key={index} className="step-item relative flex gap-8">
                            <div className="relative z-10 w-14 h-14 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center font-bold text-xl text-slate-400 shadow-sm shrink-0 transition-colors hover:border-[#00aeef] hover:text-[#00aeef]">
                                {index + 1}
                            </div>
                            <div className="pt-2">
                                <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                                <p className="text-slate-500">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Visual (Height Reduced) */}
            <div className="relative min-h-[100px] h-auto rounded-[2.5rem] overflow-hidden flex items-center justify-center">

                {/* Subtle Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-blue-400/10 rounded-[2.5rem] blur-[80px]"></div>

                {/* The Image */}
                <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <img
                        src={preview}
                        alt="BukCare App Interface"
                        className="w-auto h-auto rounded-[2.5rem] max-h-[40%] md:max-w-[80%] object-contain drop-shadow-2xl"
                    />
                </div>

            </div>

         </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-24 bg-slate-50">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
                <p className="text-slate-500 mt-4">Everything you need to know about the platform.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                <FAQItem 
                  question="Is BukCare free to use?" 
                  answer="Yes! Creating an account and searching for doctors is 100% free. You only pay the doctor's consultation fee at the clinic/hospital." 
                />
                <FAQItem 
                  question="Are the doctors verified?" 
                  answer="Absolutely. We strictly verify the medical licenses of every healthcare provider before they can list on our platform." 
                />
                <FAQItem 
                  question="Can I cancel my appointment?" 
                  answer="Yes, you can reschedule or cancel up to 2 hours before your appointment time directly through your dashboard." 
                />
            </div>
          </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-[#0f172a] text-white pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
            <div className="col-span-1 md:col-span-1">
                <div className="text-2xl font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#00aeef] rounded-md"></div>
                    <span>Buk<span className="text-[#00aeef]">Care</span></span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Connecting patients and doctors in Bukidnon. Better healthcare access for everyone, everywhere.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Platform</h4>
                <ul className="space-y-4 text-slate-400 text-sm">
                    <li><Link to="/" className="hover:text-[#00aeef] transition-colors">Home</Link></li>
                    <li><Link to="/about" className="hover:text-[#00aeef] transition-colors">About Us</Link></li>
                    <li><Link to="/services" className="hover:text-[#00aeef] transition-colors">Services</Link></li>
                    <li><Link to="/terms" className="hover:text-[#00aeef] transition-colors">Terms of Services</Link></li>
                    <li><Link to="/privacy" className="hover:text-[#00aeef] transition-colors">Privacy Policy</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Legal</h4>
                <ul className="space-y-4 text-slate-400 text-sm">
                    <li><Link to="/terms" className="hover:text-[#00aeef] transition-colors">Privacy Policy</Link></li>
                    <li><Link to="/terms" className="hover:text-[#00aeef] transition-colors">Terms of Service</Link></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Contact</h4>
                <div className="text-slate-400 text-sm space-y-4">
                    <div className="flex items-center gap-3"><IconMapPin /> Maramag, Bukidnon</div>
                    <div className="flex items-center gap-3"><IconPhone /> bukcare.app@gmail.com </div>
                    <div className="flex items-center gap-3"><Globe/> www.bukcare.com </div>
                </div>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs">
            <p>&copy; 2026 BukCare. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
                <span>Designed for Bukidnon</span>
            </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;