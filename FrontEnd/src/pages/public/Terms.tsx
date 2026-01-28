import React, { useRef, useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Scale,
  ScrollText,
  Mail,
  Menu,
  X
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import Footer from "@/components/Footer";
import logo from "@/assets/images/icon_logo_name.png";

gsap.registerPlugin(ScrollTrigger);

const Terms: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Animation & Scroll
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
        // Header Reveal
        const tl = gsap.timeline();
        tl.fromTo(".hero-reveal", 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "power3.out" }
        );

        // Content Fade In
        gsap.fromTo(".content-area",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.2 }
        );

    }, containerRef);

    return () => {
        ctx.revert();
        lenis.destroy();
    };
  }, []);

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

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden">
      
      {/* --- 1. NAVIGATION --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                    <img src={logo} className="h-25 md:h-30 lg:h-35 w-auto object-contain transition-all duration-300" alt="BukCare Logo" />
                </div>
            </Link>

          <div className="hidden md:flex items-center gap-8">
             {navLinks.map((link) => (
                <Link 
                    key={link.name}
                    to={link.path} 
                    onClick={handleScrollTop}
                    className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                        location.pathname === link.path ? "text-[#00aeef]" : "text-slate-500 hover:text-[#00aeef]"
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
                    <Link key={link.name} to={link.path} onClick={handleScrollTop} className="text-lg font-medium text-slate-700 hover:text-[#00aeef]">
                        {link.name}
                    </Link>
                ))}
            </div>
        </div>
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 px-6 bg-slate-50 border-b border-slate-100">
         <div className="max-w-4xl mx-auto text-center">
            <div className="hero-reveal inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Scale className="w-3 h-3" /> Legal & Compliance
            </div>
            
            <h1 className="hero-reveal text-4xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                Terms of <span className="text-[#00aeef]">Service</span>
            </h1>
            
            <p className="hero-reveal text-xl text-slate-500 max-w-2xl mx-auto">
                Please read these terms carefully before using our platform to ensure a safe experience for everyone.
            </p>
         </div>
      </section>

      {/* --- 3. MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-12">
          
          {/* SIDEBAR (Table of Contents)
             - Mobile: Order 2 (Appears below content)
             - Desktop: Order 1 (Appears on the left)
          */}
          <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit order-2 lg:order-1">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div className="mb-6 pb-6 border-b border-slate-100">
                      <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          <ScrollText className="w-5 h-5 text-[#00aeef]"/>
                          Table of Contents
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Effective: January 2026</p>
                  </div>
                  
                  <ul className="space-y-4 text-sm font-medium text-slate-500">
                      <li className="flex items-center gap-3 text-[#00aeef]"><span className="w-1.5 h-1.5 rounded-full bg-[#00aeef]"></span> Purpose of System</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> User Responsibilities</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Intellectual Property</li>
                      <li className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Disclaimers</li>
                  </ul>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Contact Legal</p>
                      <a href="mailto:bukcare.app@gmail.com" className="flex items-center gap-2 text-slate-700 hover:text-[#00aeef] transition-colors text-sm font-bold">
                          <Mail className="w-4 h-4" /> bukcare.app@gmail.com
                      </a>
                  </div>
              </div>
          </aside>

          {/* MAIN CONTENT
             - Mobile: Order 1 (Appears first)
             - Desktop: Order 2 (Appears on the right)
          */}
          <main className="lg:col-span-8 content-area order-1 lg:order-2">
              <div className="space-y-12">
                  <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h2>
                      <p className="text-lg text-slate-500 leading-relaxed">
                          Welcome to the BUKCARE system. By accessing or using this system, you agree to comply with these Terms. We are committed to operational integrity and providing a seamless experience for patients and doctors in Bukidnon.
                      </p>
                  </div>

                  <div className="space-y-8">
                      <section>
                          <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">1</span>
                              Purpose of the System
                          </h3>
                          <ul className="space-y-3 pl-11 text-slate-500">
                              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-[#00aeef] shrink-0 mt-0.5" /> Centralized platform for scheduling and managing appointments.</li>
                              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-[#00aeef] shrink-0 mt-0.5" /> Real-time availability updates for doctors and patient.</li>
                              <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-[#00aeef] shrink-0 mt-0.5" /> Automated notifications via Email and App Notification via Web Socket.</li>
                          </ul>
                      </section>

                      <section>
                          <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">2</span>
                              User Responsibilities
                          </h3>
                          <p className="pl-11 text-slate-500 mb-4">Users must ensure integrity when using the platform:</p>
                          <ul className="grid md:grid-cols-2 gap-4 pl-11">
                              <li className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                  <strong>Accuracy:</strong> Provide truthful information during registration.
                              </li>
                              <li className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                  <strong>Security:</strong> Keep login credentials confidential.
                              </li>
                              <li className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                  <strong>Reporting:</strong> Notify admins immediately of any unauthorized access.
                              </li>
                              <li className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                  <strong>Usage:</strong> Use the system only for intended medical purposes.
                              </li>
                          </ul>
                      </section>

                      <section>
                          <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-600 text-sm font-bold">3</span>
                              System Limitations
                          </h3>
                          <div className="pl-11 bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-800 text-sm leading-relaxed flex gap-4">
                              <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
                              <div>
                                  <p className="font-bold mb-2">Important Notice</p>
                                  <p>The system depends on stable internet connectivity. The hospital and developers are not liable for missed appointments due to ISP downtime or technical errors. This system does not provide medical advice.</p>
                              </div>
                          </div>
                      </section>
                  </div>
              </div>
          </main>
      </div>

      <Footer />
    </div>
  );
};

export default Terms;