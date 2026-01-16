import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Eye, 
  EyeOff,
  ShieldCheck, 
  Menu, 
  X,
  Stethoscope,
  Activity,
  Lock,
  ArrowRight,
  Shield
} from "lucide-react";
import toast from "react-hot-toast";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";
import { signIn } from "@/services/auth/SignInAPI";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/images/icon_logo_name.png"

interface FormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Carousel State
  const [activeFeature, setActiveFeature] = useState(0);
  const features = [
    { icon: Lock, title: "Bank-Grade Security", desc: "Your health records are encrypted and HIPAA compliant." },
    { icon: Stethoscope, title: "Verified Specialists", desc: "Connect with the top doctors in Bukidnon instantly." },
    { icon: Activity, title: "Real-Time Tracking", desc: "Monitor queue status and get live updates." },
  ];

  // Carousel Logic
  useEffect(() => {
    const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
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
    { name: "Terms of Services & Privacy Policy", path: "/Terms" },
  ];

  // Animations
  useLayoutEffect(() => {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    function raf(time: number) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
        // Form Stagger
        gsap.fromTo(".form-element", 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out", delay: 0.2 }
        );
        // Right Panel Reveal
        gsap.fromTo(".panel-reveal",
            { x: 20, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.4 }
        );
    }, containerRef);

    return () => { ctx.revert(); lenis.destroy(); };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const getRoleRedirect = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin": return "/admin/dashboard";
      case "doctor": return "/doctor/dashboard";
      case "patient": return "/patient/home";
      default: return "/";
    }
  };

  const handleLoginSuccess = (result: any) => {
    if (!result.user || !result.tokens) { setError("Invalid login response."); return; }
    login(result.tokens, result.user);
    const userRole = (result.user.role || result.user.user_type || "").toLowerCase();
    toast.success(`Welcome back, ${result.user.fname || "User"}!`);
    if (!result.user.is_profile_complete) { navigate("/complete-profile", { replace: true, state: { ...result.user } }); return; }
    const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname || getRoleRedirect(userRole);
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailLoading(true);
    setError("");
    try {
      const result = await signIn(formData);
      handleLoginSuccess(result);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Sign-in failed. Please try again.";
      setError(errMsg);
      toast.error(errMsg);
    } finally { setEmailLoading(false); }
  };

  const handleGoogleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    setGoogleLoading(true);
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
  };

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden flex flex-col">
      
      {/* --- 1. NAVIGATION BAR --- */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group" onClick={handleScrollTop}>
              <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                    {/* Logo */}
                    <img 
                        src={logo} 
                        className="h-35 w-auto object-contain" 
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

      {/* --- 2. SPLIT SCREEN LAYOUT --- */}
      <div className="flex-1 flex flex-col lg:flex-row pt-20 h-[calc(100vh-80px)] min-h-[700px]">
        
        {/* LEFT: FORM SIDE (Clean & Modern) */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 bg-white relative z-10">
             
             <div className="max-w-md w-full mx-auto">
                
                <div className="mb-10 form-element">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Welcome Back.</h1>
                    <p className="text-slate-500 text-lg">Please enter your details to sign in.</p>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 form-element animate-pulse">
                    <Shield className="w-4 h-4"/> {error}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  
                  {/* Email */}
                  <div className="form-element group">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="form-element">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00aeef] focus:border-transparent transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-[#00aeef] transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                        <Link to="/forgot-password" className="text-xs font-bold text-[#00aeef] hover:text-slate-600 transition-colors">
                        Forgot Password?
                        </Link>
                    </div>
                  </div>

                  {/* Primary Button */}
                  <button
                    type="submit"
                    disabled={emailLoading || googleLoading}
                    className="form-element w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#00aeef] hover:shadow-[#00aeef]/30 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {emailLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Signing In...</span>
                        </>
                    ) : (
                        <>Sign In <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <div className="relative my-8 form-element">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-xs uppercase font-bold text-slate-400 bg-white px-4">Or continue with</div>
                </div>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  disabled={emailLoading || googleLoading}
                  className="form-element flex items-center justify-center w-full py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all gap-3 disabled:opacity-70 group"
                >
                  {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-slate-300 border-t-[#00aeef] rounded-full animate-spin"></div>
                  ) : (
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                  )}
                  <span>Google Account</span>
                </button>

                <p className="form-element text-center mt-8 text-sm text-slate-500">
                   Don't have an account? <Link to="/signup" className="text-[#00aeef] font-bold hover:underline">Create free account</Link>
                </p>
             </div>
        </div>

        {/* RIGHT: VISUAL SIDE (The "Modern" Touch) */}
        <div className="hidden lg:flex w-1/2 bg-[#F0F9FF] relative items-center justify-center overflow-hidden">
            
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
                    alt="Medical Background" 
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#00aeef]/90 to-slate-900/60 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            </div>

            {/* Content Content - Feature Carousel */}
            <div className="panel-reveal relative z-10 w-full max-w-lg px-12 text-white">
                <div className="mb-12">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mb-8">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-5xl font-extrabold leading-[1.1] mb-6">
                        Secure Access to <br/> Better Health.
                    </h2>
                    <p className="text-blue-100 text-lg leading-relaxed font-light">
                        Manage your entire family's health journey from one secure dashboard.
                    </p>
                </div>

                {/* Animated Feature Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00aeef]"></div>
                    <div className="transition-all duration-500 ease-in-out transform">
                        {features.map((feature, idx) => (
                            <div 
                                key={idx} 
                                className={`flex items-start gap-4 transition-opacity duration-500 ${idx === activeFeature ? "block opacity-100" : "hidden opacity-0 absolute"}`}
                            >
                                <div className="p-3 bg-white rounded-xl shadow-sm text-[#00aeef]">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">{feature.title}</h4>
                                    <p className="text-sm text-blue-100 leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Pagination Dots */}
                    <div className="flex gap-2 mt-6">
                        {features.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1 rounded-full transition-all duration-300 ${idx === activeFeature ? "w-8 bg-white" : "w-2 bg-white/30"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Optional: Minimal Footer Strip if needed, or rely on main Footer */}
      {/* <Footer /> can be placed here if you want it below the fold */}
    </div>
  );
};

export default SignIn;