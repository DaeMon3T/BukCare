// src/pages/ForgotPassword.tsx
import { useState, FormEvent, ChangeEvent } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { validateEmail } from "@/utils/validation";
import { forgotPassword } from "@/services/auth/ForgotPasswordAPI";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      setSuccess("Password reset link has been sent to your email.");
      setEmail(""); // Clear email on success
    } catch (err) {
      // Security: Don't reveal if email exists
      setSuccess("If an account with that email exists, reset instructions have been sent.");
      console.error("Password reset error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </Link>
        <div className="space-x-6">
          <Link to="/signin" className="hover:underline text-[#FFC43D] font-medium">
            Sign In
          </Link>
          <Link to="/signup" className="hover:underline">
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
              Forgot <span className="text-[#FFC43D]">Password?</span>
            </h1>
            <p className="text-lg text-white/90">
              Enter your email to receive reset instructions
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="bg-green-500/20 border border-green-400/50 text-green-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {success}
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#FFD84C] transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1A1A40]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            {/* Back to Sign In Link */}
            <div className="text-center mt-8 pt-6 border-t border-white/20">
              <span className="text-white/80">
                Remember your password?{" "}
                <Link to="/signin" className="text-[#FFC43D] hover:text-[#FFD84C] transition font-semibold">
                  Back to Sign In
                </Link>
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              By requesting a reset, you agree to our{" "}
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
