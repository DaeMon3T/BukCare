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
  Shield,
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
        <div className="flex gap-10 text-xs ml-290">
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <MapPin size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">Maramag, Bukidnon, Philippines</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <Clock size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">24/7</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-cyan-500 p-1 rounded text-white">
              <Phone size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 pt-1">bukcare.app@gmail.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-b border-gray-100 py-4 px-4 md:px-12 lg:px-24 flex flex-col md:flex-row justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 shadow-sm">
        <ul className="flex flex-wrap justify-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide ml-120">
          <li><Link to="/home" className="text-cyan-500 hover:text-cyan-600">Home</Link></li>
          <li><Link to="/about" className="hover:text-cyan-500 transition-colors">About</Link></li>
          <li><Link to="/services" className="hover:text-cyan-500 transition-colors">Services</Link></li>
          <li><Link to="/contact" className="hover:text-cyan-500 transition-colors">Contact</Link></li>
          <li><Link to="/terms" className="hover:text-cyan-500 transition-colors">Terms of Services & Privacy Policy</Link></li>
        </ul>
      </div>

      {/* --- HERO / SIGN IN SECTION --- */}
      <div className="relative w-full bg-gradient-to-br from-[#EBF8FC] to-[#D5F2F9] overflow-hidden min-h-[700px] flex items-center">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 backdrop-blur-sm">
            <LoadingGear
              text={emailLoading ? "Signing you in..." : "Redirecting to Google..."}
              color="#0891b2"
              showOverlay={false}
            />
          </div>
        )}

        <div className="container mx-auto px-4 md:px-12 lg:px-24 flex flex-col-reverse lg:flex-row items-center h-full py-12">
          
          {/* Left Side: Sign In Content */}
          <div className="w-full lg:w-1/2 z-10 pr-0 lg:pr-12">
             <div className="mb-2">
                <span className="text-cyan-500 font-bold text-lg">Welcome Back</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Sign In to Your <br />
                <span className="text-cyan-600">Healthcare Account</span>
             </h1>
             
             <p className="text-gray-600 mb-8 max-w-lg leading-relaxed">
                Access your medical appointments, view your health records, and stay connected with your healthcare providers.
             </p>

             {/* Form Container */}
             <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-100 max-w-md">
                
                {/* Welcome Message */}
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Sign In</h2>
                  <p className="text-sm text-gray-500">Enter your credentials to continue</p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Email/Password Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-cyan-600 transition"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-cyan-500 hover:text-cyan-600 transition font-medium hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-cyan-600 transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {emailLoading ? (
                      <span className="text-sm">Signing In...</span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center my-6">
                  <hr className="flex-grow border-gray-200" />
                  <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
                  <hr className="flex-grow border-gray-200" />
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  disabled={isLoading}
                  className="flex items-center justify-center w-full py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-cyan-400 transition-all shadow-sm gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {googleLoading ? (
                    <span className="text-sm">Redirecting...</span>
                  ) : (
                    <>
                      <img
                        src="https://developers.google.com/identity/images/g-logo.png"
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span className="text-sm group-hover:text-cyan-600 transition-colors">Sign in with Google</span>
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                  <Shield size={14} className="text-cyan-500" />
                  <span>Your data is secure and encrypted</span>
                </div>

                {/* Sign Up Link */}
                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                   <span className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-cyan-500 font-semibold hover:text-cyan-600 hover:underline transition-colors">
                        Sign up here
                      </Link>
                   </span>
                </div>

                {/* Terms */}
                <div className="text-center mt-4">
                    <p className="text-xs text-gray-400">
                      By signing in, you agree to our{" "}
                      <Link to="/terms" className="text-cyan-500 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/terms" className="text-cyan-500 hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                </div>
             </div>
          </div>

          {/* Right Side: Image */}
          <div className="hidden lg:block w-1/2 relative h-full min-h-[600px]">
             {/* Abstract Shape Background */}
             <div className="absolute top-0 right-0 w-[120%] h-full bg-gradient-to-l from-white/30 to-transparent z-0"></div>
             
             {/* Decorative Circles */}
             <div className="absolute top-20 right-40 w-32 h-32 bg-cyan-200/30 rounded-full blur-3xl"></div>
             <div className="absolute bottom-40 right-20 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
             
             {/* Image Container */}
             <div className="absolute bottom-0 right-0 lg:-right-12 xl:right-0 z-10">
                <img 
                  src="./bukcare_logo.png" 
                  alt="Healthcare Professional" 
                  className="h-[700px] object-contain object-bottom drop-shadow-2xl"
                  style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}
                />
             </div>
          </div>
        </div>
      </div>

      {/* --- INFO BOXES SECTION --- */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-white">
        {/* Box 1 */}
        <div className="bg-[#0092BA] p-8 flex flex-col items-center text-center group hover:bg-[#0081a3] transition-all cursor-pointer">
          <div className="mb-4 transform group-hover:scale-110 transition-transform">
             <Stethoscope size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">Access Your Records</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             View your complete medical history, prescriptions, and test results in one secure place.
          </p>
        </div>

        {/* Box 2 */}
        <div className="bg-[#5BC0DE] p-8 flex flex-col items-center text-center group hover:bg-[#4ab0ce] transition-all cursor-pointer">
          <div className="mb-4 transform group-hover:scale-110 transition-transform">
             <Ambulance size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">Manage Appointments</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             Book, reschedule, or cancel appointments with your healthcare providers easily.
          </p>
        </div>

        {/* Box 3 */}
        <div className="bg-[#0092BA] p-8 flex flex-col items-center text-center group hover:bg-[#0081a3] transition-all cursor-pointer">
           <div className="mb-4 transform group-hover:scale-110 transition-transform">
             <Clock size={40} className="text-white opacity-90" />
          </div>
          <h3 className="text-lg font-bold mb-2">24/7 Access</h3>
          <p className="text-sm text-white/80 leading-relaxed mb-4">
             Your health information is available anytime, anywhere you need it.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SignIn;