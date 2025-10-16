// pages/auth/SignUp.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleGoogleRedirect = () => {
    setLoading(true);
    window.location.href = `${BACKEND_URL}/auth/google/login`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </Link>
        <div className="space-x-6">
          <Link to="/signin" className="hover:underline">
            Sign In
          </Link>
          <Link to="/signup" className="hover:underline text-[#FFC43D] font-medium">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-xl">
              Create <span className="text-[#FFC43D]">Account</span>
            </h1>
            <p className="text-lg text-white/90">
              Sign up to start managing your healthcare appointments
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            {/* Google Sign-Up Button */}
            <button
              onClick={handleGoogleRedirect}
              disabled={loading}
              className="flex items-center justify-center w-full py-3 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition disabled:opacity-50"
            >
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                className="w-5 h-5 mr-3"
              />
              {loading ? "Redirecting to Google..." : "Sign up with Google"}
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-8 pt-6 border-t border-white/20">
              <span className="text-white/80">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-[#FFC43D] hover:text-[#FFD84C] transition font-semibold"
                >
                  Sign in here
                </Link>
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-[#FFC43D] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#FFC43D] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
