import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
    <div className="relative min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </Link>
      </nav>

      {/* 🌀 Page overlay loader (transparent center) */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <LoadingGear
            text={emailLoading ? "Signing you in..." : "Redirecting to Google..."}
            color="#FFC43D"
            showOverlay={false}
          />
        </div>
      )}

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12 relative z-10">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-xl">
              Welcome <span className="text-[#FFC43D]">Back</span>
            </h1>
            <p className="text-lg text-white/90">
              Sign in to manage your healthcare appointments
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
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
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent transition"
                />
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#FFC43D] hover:text-[#FFD84C] transition font-medium"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#FFD84C] transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {emailLoading ? (
                  <LoadingGear text="Signing In..." color="#1A1A40" showOverlay={false} />
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="flex items-center my-6">
              <hr className="flex-grow border-white/20" />
              <span className="px-4 text-white/60 text-sm font-medium">OR</span>
              <hr className="flex-grow border-white/20" />
            </div>

            <button
              type="button"
              onClick={handleGoogleRedirect}
              disabled={isLoading}
              className="flex items-center justify-center w-full py-3 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
            >
              {googleLoading ? (
                <LoadingGear text="Redirecting..." color="#333" showOverlay={false} />
              ) : (
                <>
                  <img
                    src="https://developers.google.com/identity/images/g-logo.png"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="text-center mt-8 pt-6 border-t border-white/20">
              <span className="text-white/80">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#FFC43D] hover:text-[#FFD84C] transition font-semibold">
                  Sign up here
                </Link>
              </span>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-white/60">
                By signing in, you agree to our{" "}
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
      </div>

      <Footer />
    </div>
  );
};

export default SignIn;
