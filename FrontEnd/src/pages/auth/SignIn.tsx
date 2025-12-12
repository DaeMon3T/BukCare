import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  MapPin, 
  Clock, 
  Phone, 
  Stethoscope,
  Ambulance,
 
} from "lucide-react";
import LoadingGear from "@/components/common/LoadingGear";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
import { signIn } from "@/services/auth/SignInAPI";
import { useAuth } from "@/context/AuthContext";

interface FormData {
  email: string;
  password: string;
}

const SignIn: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("SignIn component - isAuthenticated:", isAuthenticated);
    console.log("SignIn component - current location:", location.pathname);
  }, [isAuthenticated, location.pathname]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const getRoleRedirect = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "/admin/dashboard";
      case "doctor":
        return "/doctor/dashboard";
      case "patient":
        return "/patient/home";
      default:
        return "/";
    }
  };

  const handleLoginSuccess = (result: any) => {
    if (!result.user || !result.tokens) {
      setError("Invalid login response from server.");
      toast.error("Invalid login response from server.");
      return;
    }

    login(result.tokens, result.user);
    const userRole = (result.user.role || result.user.user_type || "").toLowerCase();
    toast.success(`Welcome back, ${result.user.fname || "User"}!`);

    if (!result.user.is_profile_complete) {
      toast("Please complete your profile before continuing.", { icon: "📝" });
      navigate("/complete-profile", {
        replace: true,
        state: {
          user_id: result.user.user_id,
          email: result.user.email,
          fname: result.user.fname,
          lname: result.user.lname,
          picture: result.user.picture,
        },
      });
      return;
    }

    const redirectPath =
      (location.state as { from?: { pathname: string } })?.from?.pathname ||
      getRoleRedirect(userRole);
    navigate(redirectPath, { replace: true });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEmailLoading(true);
    setError("");

    try {
      const result = await signIn(formData);
      handleLoginSuccess(result);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Sign-in failed. Please try again.";

      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    setGoogleLoading(true);
    toast.loading("Redirecting to Google...", { id: "google-redirect" });
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
  };

  const isLoading = emailLoading || googleLoading;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-700">
      {/* --- HEADER SECTION --- */}
      
      {/* Top Contact Bar */}
      <div className="bg-white border-b border-gray-100 py-4 px-4 md:px-12 lg:px-24 hidden md:flex justify-between items-center">

        {/* Contact Info */}
        <div className="flex gap-10 text-xs ml-290 ">
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <MapPin size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">Maramag, Bukidnon, Philippines</p>
              <p className="text-gray-500"></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <Clock size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">24/7</p>
              <p className="text-gray-500"></p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <Phone size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">bukcare.app@gmail.com</p>
              <p className="text-gray-500"></p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-b border-gray-100 py-4 px-4 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <ul className="flex flex-wrap justify-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide ml-120">
          <li><Link to="/" className="text-cyan-500 hover:text-cyan-600">Home</Link></li>
          <li><Link to="/about" className="hover:text-cyan-500 transition-colors">About</Link></li>
          <li><Link to="/projects" className="hover:text-cyan-500 transition-colors">Services</Link></li>
          <li><Link to="/departments" className="hover:text-cyan-500 transition-colors">Contact</Link></li>
          <li><Link to="/pricing" className="hover:text-cyan-500 transition-colors">Terms of Service & Privacy Policy</Link></li>
        </ul>

        
      </div>

      {/* --- HERO / LOGIN SECTION --- */}
      <div className="relative w-full bg-[#EBF8FC] overflow-hidden min-h-[600px] flex items-center">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 backdrop-blur-sm">
            <LoadingGear
              text={emailLoading ? "Signing you in..." : "Redirecting to Google..."}
              color="#06b6d4"
              showOverlay={false}
            />
          </div>
        )}

        <div className="container mx-auto px-4 md:px-12 lg:px-24 flex flex-col-reverse lg:flex-row items-center h-full py-12">
          
          {/* Left Side: Login Form (Replacing the Text) */}
          <div className="w-full lg:w-1/2 z-10 pr-0 lg:pr-12">
             <div className="mb-2">
                <span className="text-cyan-500 font-bold text-lg">Sign In</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Secure Access To <br />
                <span className="text-gray-600">BukCare</span>
             </h1>
             
             <p className="text-gray-500 mb-8 max-w-lg">
                Sign in to manage appointments, view medical history, and connect with your doctors. Reliable healthcare access starts here.
             </p>

             {/* Form Container */}
             <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-100 max-w-md">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-100">
                        {error}
                      </div>
                    )}

                    <div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-cyan-500 transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                       <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-cyan-500 text-white font-bold py-3 px-8 rounded shadow hover:bg-cyan-600 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          {emailLoading ? "Loading..." : "Sign In"}
                        </button>

                        <Link
                          to="/forgot-password"
                          className="text-sm text-gray-500 hover:text-cyan-500 transition font-medium"
                        >
                          Forgot Password?
                        </Link>
                    </div>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100">
                   <button
                    type="button"
                    onClick={handleGoogleRedirect}
                    disabled={isLoading}
                    className="flex items-center justify-center w-full py-2.5 bg-white border border-gray-300 text-gray-600 font-semibold rounded hover:bg-gray-50 transition shadow-sm gap-2"
                   >
                     {googleLoading ? (
                       <span className="text-xs">Connecting...</span>
                     ) : (
                       <>
                         <img
                           src="https://developers.google.com/identity/images/g-logo.png"
                           alt="Google"
                           className="w-4 h-4"
                         />
                         <span className="text-sm">Sign in with Google</span>
                       </>
                     )}
                   </button>
                   <div className="text-center mt-4">
                      <span className="text-sm text-gray-500">
                         New patient? <Link to="/signup" className="text-cyan-500 font-semibold hover:underline">Register Now</Link>
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* Right Side: Doctor Image */}
          {/* Note: In a real scenario, use the actual image file. Using a placeholder here that matches the vibe */}
          <div className="hidden lg:block w-1/2 relative h-full min-h-[500px]">
             {/* Abstract Blue Shape Background */}
             <div className="absolute top-0 right-0 w-[120%] h-full bg-gradient-to-l from-white/30 to-transparent z-0"></div>
             
             {/* Doctor Image Container */}
             <div className="absolute bottom-0 right-0 lg:-right-12 xl:right-0 z-10">
                <img 
                  src="./bukcare_logo.png" 
                  alt="Doctor" 
                  className="h-[600px] object-contain object-bottom drop-shadow-2xl mask-image-b"
                  style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
                />
             </div>
          </div>
        </div>
      </div>

      {/* --- INFO BOXES SECTION (Bottom of Hero) --- */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-white">
        {/* Box 1 */}
        <div className="bg-[#0092BA] p-8 flex flex-col items-center text-center group hover:bg-[#0081a3] transition cursor-pointer">
          <div className="mb-4">
             <Stethoscope size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">Qualified Doctors</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             Browse our directory of qualified doctors in Bukidnon and view their availability schedules instantly.
          </p>
        </div>

        {/* Box 2 */}
        <div className="bg-[#5BC0DE] p-8 flex flex-col items-center text-center group hover:bg-[#4ab0ce] transition cursor-pointer">
          <div className="mb-4">
             <Ambulance size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">Emergency Services</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             Need urgent care? Find the nearest doctor available 24/7 in your area. 
          </p>
        </div>

        {/* Box 4 */}
        <div className="bg-[#0092BA] p-8 flex flex-col items-center text-center group hover:bg-[#0081a3] transition cursor-pointer">
           <div className="mb-4">
             <Clock size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">24/7 Services</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             Book appointment with your preferred specialists anytime, anywhere, without visiting the clinic.
          </p>
        </div>
      </div>
      
      {/* Terms and Privacy moved to footer area or small text below login */}
      <Footer />
    </div>
  );
};

export default SignIn;