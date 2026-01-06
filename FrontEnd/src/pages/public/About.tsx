import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  Activity, 
  Menu, 
  X, 
  HeartHandshake, 
  Lightbulb, 
  ArrowRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import api from "@/services/api"; 
import Footer from "@/components/Footer";
import logo from "@/assets/images/bukcare_logo.png"

gsap.registerPlugin(ScrollTrigger);

const About: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic Data
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Specializations (With Fallback)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/doctors");
        if (Array.isArray(res.data) && res.data.length > 0) {
            const uniqueSpecs = Array.from(new Set(res.data.map((d: any) => d.specialization))).slice(0, 10) as string[];
            setSpecialties(uniqueSpecs);
        } else {
            // FALLBACK DATA (If API is empty or offline, show these to keep UI looking good)
            setSpecialties(["Cardiology", "Pediatrics", "Dermatology", "Neurology", "General Surgery", "Internal Medicine", "Oncology", "Orthopedics"]);
        }
      } catch (err) {
        console.error("Using fallback data due to API error", err);
        setSpecialties(["Cardiology", "Pediatrics", "Dermatology", "Neurology", "General Surgery", "Internal Medicine"]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Animations & Smooth Scroll
  useLayoutEffect(() => {
    // Lenis Smooth Scroll
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

    // GSAP Context
    const ctx = gsap.context(() => {
        // Hero Reveal
        const heroTl = gsap.timeline();
        heroTl.fromTo(".hero-reveal", 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
        );

        // Image Scale Reveal
        gsap.fromTo(".hero-image-wrapper",
            { scale: 0.95, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out", delay: 0.4 }
        );

        // Section Headers (ScrollTrigger)
        gsap.utils.toArray<HTMLElement>(".section-reveal").forEach((elem) => {
            gsap.fromTo(elem,
                { y: 40, opacity: 0 },
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: elem,
                        start: "top 85%",
                    }
                }
            );
        });

        // Value Cards Stagger
        gsap.fromTo(".value-card",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".values-grid",
                    start: "top 75%",
                }
            }
        );

    }, containerRef);
    
    return () => {
        ctx.revert();
        lenis.destroy();
    };
  }, [loading]); // Re-run animations once loading finishes

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Terms of Services & Privacy Policy", path: "/Terms" },
  ];

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden">
      
      {/* --- 1. NAVIGATION --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={handleScrollTop}>
             {/* Logo Wrapper */}
             <div className="w-15 h-15 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <img src={logo} className="w-20 h-20"/>
             </div>
             <span className="text-xl font-bold text-slate-900 tracking-tight">
               Buk<span className="text-[#00aeef]">Care</span>
             </span>
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

      {/* --- 2. HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden bg-gradient-to-b from-blue-50/30 to-white">
         <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left: Text */}
                <div className="hero-content relative z-10">
                    <div className="hero-reveal inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-[#00aeef] rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#00aeef] animate-pulse"></span>
                        Established 2025
                    </div>
                    
                    <h1 className="hero-reveal text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                        Care for the <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Community.</span>
                    </h1>
                    
                    <p className="hero-reveal text-xl text-slate-500 mb-8 leading-relaxed max-w-lg">
                        We are a locally-rooted digital health initiative dedicated to streamlining the healthcare experience in Bukidnon. No barriers, just care.
                    </p>

                    <div className="hero-reveal flex flex-wrap gap-4">
                        <Link to="/contact" className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-[#00aeef] hover:shadow-blue-500/30 transition-all flex items-center gap-2 hover:-translate-y-1">
                            Talk to Us <ArrowRight className="w-4 h-4"/>
                        </Link>
                        <Link to="/services" className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:border-[#00aeef] hover:text-[#00aeef] transition-all">
                            View Services
                        </Link>
                    </div>
                </div>

                {/* Right: Image */}
                <div className="hero-image-wrapper relative lg:translate-x-10">
                    <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100 border border-slate-100 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                        <img 
                            src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=2091&auto=format&fit=crop" 
                            alt="Doctor holding hands" 
                            className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                    </div>
                    
                    {/* Floating Badge */}
                    <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 max-w-xs hidden md:block animate-float">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                 <Activity className="w-4 h-4" />
                             </div>
                             <p className="text-slate-900 font-bold text-lg">"Health is Wealth"</p>
                        </div>
                        <p className="text-slate-500 text-sm">Every citizen deserves easy access to medical professionals.</p>
                    </div>
                </div>

            </div>
         </div>
      </section>

      {/* --- 3. DYNAMIC SERVICES TICKER --- */}
      {/* Displays Live Specialties from API */}
      <div className="bg-slate-50 border-y border-slate-100 py-10 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10"></div>
          
          <div className="flex animate-marquee whitespace-nowrap">
              {/* Duplicating array to ensure seamless loop */}
              {Array(4).fill(specialties).flat().map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 mx-8 opacity-50 hover:opacity-100 transition-opacity cursor-default">
                      <Activity className="w-5 h-5 text-[#00aeef]" />
                      <span className="text-xl font-bold text-slate-800 uppercase tracking-widest">{spec}</span>
                  </div>
              ))}
          </div>
      </div>

      {/* --- 4. THE STORY --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
            <div className="section-reveal">
                <h2 className="text-sm font-bold text-[#00aeef] uppercase tracking-widest mb-4">Our Origin</h2>
                <h3 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-10 leading-tight">
                    From manual logs to <br/> <span className="text-[#00aeef]">digital efficiency.</span>
                </h3>
            </div>
            
            <div className="section-reveal space-y-8 text-lg md:text-xl text-slate-500 leading-relaxed font-light">
                <p>
                    In Bukidnon, finding a specialist often meant traveling hours to the city, only to find the clinic closed or fully booked. We saw patients waiting in lines from dawn, clutching paper records that were easily lost.
                </p>
                <div className="py-6">
                    <p className="text-2xl font-bold text-slate-800 italic border-l-4 border-[#00aeef] pl-6">
                        "BukCare was built to solve this. We envisioned a centralized platform where access takes seconds, not hours."
                    </p>
                </div>
                <p>
                    Today, we are partnering with hospitals and clinics across the province to create a unified, secure, and accessible healthcare ecosystem for everyone.
                </p>
            </div>
        </div>
      </section>

      {/* --- 5. CORE VALUES --- */}
      <section className="py-32 px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 section-reveal">
                <h2 className="text-4xl font-extrabold text-slate-900">What Drives Us</h2>
                <div className="h-1.5 w-20 bg-[#00aeef] mx-auto mt-6 rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 values-grid">
                {/* Innovation */}
                <div className="value-card bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:-translate-y-2 transition-all duration-300">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#00aeef] mb-8 group-hover:scale-110 transition-transform">
                        <Lightbulb className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-4">Innovation</h4>
                    <p className="text-slate-500 leading-relaxed">
                        We leverage modern technology to simplify complex medical processes, making health management intuitive for all ages.
                    </p>
                </div>

                {/* Compassion */}
                <div className="value-card bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:-translate-y-2 transition-all duration-300">
                    <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 mb-8 group-hover:scale-110 transition-transform">
                        <HeartHandshake className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-4">Compassion</h4>
                    <p className="text-slate-500 leading-relaxed">
                        Technology is our tool, but care is our mission. We design every feature with the patient's well-being in mind.
                    </p>
                </div>

                {/* Integrity */}
                <div className="value-card bg-white p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 group hover:-translate-y-2 transition-all duration-300">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-8 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-4">Integrity</h4>
                    <p className="text-slate-500 leading-relaxed">
                        We uphold the highest standards of data privacy and ethical practice. Your health data is sacred and secure with us.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* --- 6. SIMPLE CTA --- */}
      <section className="py-24 px-6 bg-[#0f172a] text-white text-center relative overflow-hidden">
        {/* Abstract BG */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#00aeef] rounded-full blur-[128px] opacity-20"></div>

        <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight">Your Health, Your Control.</h2>
            <p className="text-slate-400 text-xl mb-12 font-light">
                Join the platform that is changing how Bukidnon accesses healthcare.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/signup" className="px-10 py-5 bg-[#00aeef] text-white rounded-xl font-bold text-lg shadow-lg hover:bg-[#009bd5] hover:shadow-[#00aeef]/40 transition-all transform hover:-translate-y-1">
                    Create Free Account
                </Link>
                <Link to="/contact" className="px-10 py-5 bg-transparent border border-slate-700 text-white rounded-xl font-bold text-lg hover:bg-white/5 transition-all">
                    Contact Us
                </Link>
            </div>
        </div>
      </section>

      <Footer />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default About;