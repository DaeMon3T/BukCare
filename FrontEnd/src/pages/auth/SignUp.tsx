import { useState, useRef, useLayoutEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  X,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";
import Footer from "@/components/Footer";
import logo from "@/assets/images/bukcare_logo.png"


export default function SignUp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  
  // Navigation State
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
    { name: "Terms of Services & Privacy Policy", path: "/Terms" },
  ];

  const handleGoogleRedirect = () => {
    setLoading(true);
    // Preserving your logic
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  // Standard Animations (Matches About.tsx)
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
        // Hero/Form Reveal
        gsap.fromTo(".hero-reveal", 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
        );

        // Image Slide In
        gsap.fromTo(".image-reveal",
            { x: 30, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.4 }
        );

    }, containerRef);

    return () => {
        ctx.revert();
        lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden">
      
      {/* --- 1. NAVIGATION BAR (Standardized) --- */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={handleScrollTop}>
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

      {/* --- 2. SIGN UP SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden bg-gradient-to-b from-blue-50/50 to-white min-h-screen flex flex-col justify-center">
         
         {/* Abstract Background Shapes (Same as About.tsx) */}
         <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] z-0 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-[80px] z-0 pointer-events-none"></div>

         <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
            
            {/* Left: Form Content */}
            <div className="hero-reveal">
                <h1 className="text-4xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                    Create your <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] to-[#0077a3]">Healthcare ID.</span>
                </h1>
                
                <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                    One account to schedule appointments, view medical history, and connect with doctors across Bukidnon.
                </p>

                {/* Google Sign In Card */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md">
                    <div className="mb-6 text-center">
                        <p className="text-slate-900 font-bold text-lg">Get Started</p>
                        <p className="text-slate-400 text-sm">Secure access via Google</p>
                    </div>

                    <button
                        onClick={handleGoogleRedirect}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-[#00aeef] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 disabled:opacity-70 group"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#00aeef] rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6 group-hover:scale-110 transition-transform"/>
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>

                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <div className="space-y-3">
                            {[
                                "HIPAA Compliant Security",
                                "Instant Account Activation",
                                "24/7 Access to Records"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-500">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm text-slate-500 ml-4">
                    <span>Already have an account?</span>
                    <Link to="/signin" className="text-[#00aeef] font-bold hover:underline flex items-center gap-1">
                        Sign In <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Right: Visual (Matching About.tsx Style) */}
            <div className="image-reveal relative lg:translate-x-10 hidden lg:block">
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100 border border-slate-100 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                    <img 
                        src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                        alt="Medical Professional" 
                        className="w-full h-full object-cover scale-105 hover:scale-110 transition-transform duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute top-10 -left-10 bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 animate-bounce-slow">
                    <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#00aeef]">
                             <Lock className="w-5 h-5" />
                         </div>
                         <div>
                             <p className="text-slate-900 font-bold text-sm">Secure Portal</p>
                             <p className="text-green-500 text-xs font-bold">Encrypted Connection</p>
                         </div>
                    </div>
                </div>
            </div>

         </div>
      </section>

      <Footer />
    </div>
  );
}