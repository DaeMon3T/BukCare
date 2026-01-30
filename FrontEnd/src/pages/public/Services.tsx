import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Stethoscope, 
  Activity, 
  Heart, 
  Brain, 
  Bone, 
  Eye, 
  Baby, 
  Menu, 
  X,
  Search,
  CalendarCheck,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  Thermometer,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";
import api from "@/services/api"; 
import Footer from "./Footer";
import logo from "@/assets/images/icon_logo_name.png"

gsap.registerPlugin(ScrollTrigger);

const Services: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic Data
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Data (With Fallback)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/doctors");
        if (Array.isArray(res.data) && res.data.length > 0) {
            const uniqueSpecs = Array.from(new Set(res.data.map((d: any) => d.specialization))) as string[];
            setSpecialties(uniqueSpecs);
        } else {
            // Fallback for visual testing
            setSpecialties(["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Dermatology", "Orthopedics", "Ophthalmology"]);
        }
      } catch (err) {
        console.error("Using fallback due to API error", err);
        setSpecialties(["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Dermatology", "Orthopedics"]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Animations & Smooth Scroll
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

    if (!loading) {
        const ctx = gsap.context(() => {
            // Hero Elements
            const heroTl = gsap.timeline();
            heroTl.fromTo(".hero-item", 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
            );

            gsap.fromTo(".hero-image", 
                { x: 30, opacity: 0 },
                { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.4 }
            );

            // Service Cards Stagger
            gsap.fromTo(".service-card", 
                { y: 50, opacity: 0 },
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.1, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".services-grid",
                        start: "top 80%",
                    }
                }
            );

            // Process Steps
            gsap.fromTo(".process-step", 
                { y: 40, opacity: 0 },
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.2, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".process-section",
                        start: "top 75%",
                    }
                }
            );

            // Features Section
            gsap.fromTo(".feature-item", 
                { x: -20, opacity: 0 },
                {
                    x: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.1, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: ".features-list",
                        start: "top 80%",
                    }
                }
            );

        }, containerRef);
        return () => ctx.revert();
    }
    
    return () => lenis.destroy();
  }, [loading]);

  // Icon Mapper Helper
  const getIconForSpecialty = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes("heart") || s.includes("cardio")) return <Heart className="w-8 h-8 text-rose-500"/>;
    if (s.includes("brain") || s.includes("neuro")) return <Brain className="w-8 h-8 text-purple-500"/>;
    if (s.includes("bone") || s.includes("ortho")) return <Bone className="w-8 h-8 text-slate-500"/>;
    if (s.includes("eye") || s.includes("opth")) return <Eye className="w-8 h-8 text-blue-500"/>;
    if (s.includes("baby") || s.includes("pedia")) return <Baby className="w-8 h-8 text-pink-500"/>;
    if (s.includes("general") || s.includes("med")) return <Thermometer className="w-8 h-8 text-green-500"/>;
    if (s.includes("derma") || s.includes("skin")) return <Activity className="w-8 h-8 text-amber-500"/>;
    return <Stethoscope className="w-8 h-8 text-[#00aeef]"/>;
  };

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

      {/* --- 2. HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden bg-gradient-to-br from-blue-50/50 to-white">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text */}
            <div className="hero-content relative z-10">
                <div className="hero-item inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-[#00aeef] rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                    <Activity className="w-3 h-3" /> Comprehensive Care
                </div>
                
                <h1 className="hero-item text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                    Medical Services <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Simplified.</span>
                </h1>
                
                <p className="hero-item text-xl text-slate-500 mb-8 leading-relaxed max-w-lg">
                    From routine checkups to specialized treatments, find the right doctor for your needs without the hassle of traditional booking.
                </p>

                <div className="hero-item flex flex-wrap gap-4">
                    <button 
                        onClick={() => document.getElementById('specialties')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/20 hover:bg-[#00aeef] hover:shadow-blue-500/30 transition-all flex items-center gap-2 hover:-translate-y-1"
                    >
                        Explore Departments <ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* Right: Image */}
            <div className="hero-image relative lg:translate-x-10">
                <div className="aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100 border border-slate-100 transform -rotate-2 hover:rotate-0 transition-transform duration-700">
                    <img 
                        src="https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                        alt="Medical Services" 
                        className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent"></div>
                </div>
            </div>

         </div>
      </section>

      {/* --- 3. DYNAMIC SPECIALTIES (Grid) --- */}
      <section id="specialties" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Available Departments</h2>
                <div className="h-1.5 w-20 bg-[#00aeef] mx-auto mb-6 rounded-full"></div>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                    Connect with verified specialists across these fields today.
                </p>
            </div>

            {loading ? (
                // Skeletons
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse"></div>
                    ))}
                </div>
            ) : specialties.length > 0 ? (
                // Real Data Grid
                <div className="services-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {specialties.map((spec, index) => (
                        <div 
                            key={index} 
                            className="service-card group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#00aeef] group-hover:text-white transition-colors duration-300 group-hover:scale-110">
                                {getIconForSpecialty(spec)}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{spec}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 bg-slate-50 px-3 py-1 rounded-full">
                                Appointments Available
                            </p>
                            <Link 
                                to="/signup" 
                                className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-[#00aeef] group-hover:gap-3 transition-all"
                            >
                                Find Doctor <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                // Empty State
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Updating directory...</p>
                </div>
            )}
        </div>
      </section>

      {/* --- 4. HOW IT WORKS --- */}
      <section className="process-section py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">How to get treated.</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-12 relative">
                {/* Connector Line (Desktop) */}
                <div className="hidden md:block absolute top-10 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>

                {[
                    { 
                        icon: UserCheck, 
                        title: "1. Create Account", 
                        desc: "Register securely. Your medical history stays private." 
                    },
                    { 
                        icon: Search, 
                        title: "2. Choose Specialist", 
                        desc: "Filter by specialty or availability." 
                    },
                    { 
                        icon: CalendarCheck, 
                        title: "3. Book Slot", 
                        desc: "Select a time and receive instant confirmation." 
                    }
                ].map((step, i) => (
                    <div key={i} className="process-step bg-white text-center group">
                        <div className="w-20 h-20 mx-auto bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-slate-200 mb-8 group-hover:scale-110 group-hover:bg-[#00aeef] transition-all duration-300">
                            <step.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                        <p className="text-slate-500 leading-relaxed px-4">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- 5. PLATFORM FEATURES --- */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                
                {/* Left: List */}
                <div className="features-list">
                    <span className="text-[#00aeef] font-bold tracking-widest uppercase text-xs mb-2 block">Why Choose Us</span>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        Designed for <br/> Modern Patients.
                    </h2>
                    <p className="text-lg text-slate-500 mb-10">
                        We replaced the clipboard with a dashboard. Experience a smoother, faster, and more transparent healthcare journey.
                    </p>
                    <div className="space-y-5">
                        {[
                            "Instant Appointment Confirmation",
                            "Secure Digital Health Records",
                            "Real-time Doctor Availability",
                            "SMS & Email Reminders"
                        ].map((item, i) => (
                            <div key={i} className="feature-item flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                                <span className="text-slate-800 font-bold">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Abstract UI Card */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-blue-100 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -z-10 opacity-50"></div>
                    
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#00aeef] to-[#0077a3] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-slate-900">System Status</h4>
                            <p className="text-sm text-green-600 font-bold flex items-center gap-2 mt-1">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span> 
                                All Systems Operational
                            </p>
                        </div>
                    </div>
                    
                    {/* Simulated Appointments */}
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-blue-100 transition-colors">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm"></div>
                                    <div className="space-y-2">
                                        <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                                        <div className="h-2 w-16 bg-slate-200 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="h-8 w-20 bg-white rounded-lg border border-slate-200"></div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </section>

      {/* --- 6. CTA --- */}
      <section className="py-24 px-6 bg-[#00aeef] relative overflow-hidden">
         {/* Abstract BG */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white rounded-full blur-[100px] opacity-20"></div>

         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Your health comes first.</h2>
            <p className="text-white/90 text-xl mb-12 max-w-2xl mx-auto font-medium">
                Stop waiting in line. Start booking online.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link to="/signup" className="px-10 py-5 bg-white text-[#00aeef] rounded-xl font-bold text-lg shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:-translate-y-1 transition-all">
                    Book Now
                </Link>
                <Link to="/contact" className="px-10 py-5 bg-[#008fb3] text-white rounded-xl font-bold text-lg hover:bg-[#007da0] transition-all border border-white/10">
                    Contact Us
                </Link>
            </div>
         </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;