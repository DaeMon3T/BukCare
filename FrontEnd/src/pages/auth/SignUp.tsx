import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Stethoscope,
  Ambulance,
} from "lucide-react";
import LoadingGear from "@/components/common/LoadingGear"; 
import Footer from "@/components/Footer";

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleGoogleRedirect = () => {
    setLoading(true);
    // Preserving original logic
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

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
          <li><Link to="/home" className="text-cyan-500 hover:text-cyan-600">Home</Link></li>
          <li><Link to="/about" className="hover:text-cyan-500 transition-colors">About</Link></li>
          <li><Link to="/services" className="hover:text-cyan-500 transition-colors">Services</Link></li>
          <li><Link to="/contact" className="hover:text-cyan-500 transition-colors">Contact</Link></li>
          <li><Link to="/terms" className="hover:text-cyan-500 transition-colors">Terms of Services & Privacy Policy</Link></li>
        </ul>
      </div>

      {/* --- HERO / SIGN UP SECTION --- */}
      <div className="relative w-full bg-[#EBF8FC] overflow-hidden min-h-[600px] flex items-center">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50 backdrop-blur-sm">
             {/* Fallback text if LoadingGear isn't available, or use the component if it is */}
             <div className="text-cyan-600 font-bold">Redirecting to Google...</div>
          </div>
        )}

        <div className="container mx-auto px-4 md:px-12 lg:px-24 flex flex-col-reverse lg:flex-row items-center h-full py-12">
          
          {/* Left Side: Sign Up Content */}
          <div className="w-full lg:w-1/2 z-10 pr-0 lg:pr-12">
             <div className="mb-2">
                <span className="text-cyan-500 font-bold text-lg">Sign Up</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 leading-tight">
                Create Your <br />
                <span className="text-gray-600">Account</span>
             </h1>
             
             <p className="text-gray-500 mb-8 max-w-lg">
                Sign up to start managing your healthcare appointments, view medical history, and connect with your doctors.
             </p>

             {/* Form Container */}
             <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-100 max-w-md">
                
                {/* Google Sign-Up Button */}
                <button
                  onClick={handleGoogleRedirect}
                  disabled={loading}
                  className="flex items-center justify-center w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-50 transition shadow-sm gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="text-sm">Redirecting...</span>
                  ) : (
                    <>
                      <img
                        src="https://developers.google.com/identity/images/g-logo.png"
                        alt="Google"
                        className="w-5 h-5"
                      />
                      <span className="text-sm">Sign up with Google</span>
                    </>
                  )}
                </button>

                <div className="text-center mt-6 pt-6 border-t border-gray-100">
                   <span className="text-sm text-gray-500">
                      Already have an account?{" "}
                      <Link to="/signin" className="text-cyan-500 font-semibold hover:underline">
                        Sign in here
                      </Link>
                   </span>
                </div>

                {/* Additional Info / Terms */}
                <div className="text-center mt-4">
                    <p className="text-xs text-gray-400">
                      By signing up, you agree to our{" "}
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
          <div className="hidden lg:block w-1/2 relative h-full min-h-[500px]">
             {/* Abstract Blue Shape Background */}
             <div className="absolute top-0 right-0 w-[120%] h-full bg-gradient-to-l from-white/30 to-transparent z-0"></div>
             
             {/* Image Container */}
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

      {/* --- INFO BOXES SECTION --- */}
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

        {/* Box 3 */}
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
      
      <Footer />
    </div>
  );
}