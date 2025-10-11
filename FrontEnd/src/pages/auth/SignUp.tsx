// pages/auth/SignUp.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import { useAuth } from "@/context/AuthContext";
import { googleSignUp, GoogleSignUpResponse } from "@/services/auth/GoogleSignUpAPI";
import Footer from "@/components/Footer";

// Define CredentialResponse locally
interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

// Match the Tokens interface from AuthContext
interface Tokens {
  access_token: string;
  refresh_token: string;
}

// Extended response type that matches what the backend actually returns
interface GoogleSignUpResponse {
  access_token?: string;
  refresh_token?: string;
  user?: {
    user_id: string;
    email: string;
    name?: string;
    fname?: string;
    lname?: string;
    picture?: string;
    user_type: string;
    is_profile_complete: boolean;
  };
}

// Extended response type that matches what the backend actually returns
interface GoogleSignUpResponse {
  access_token?: string;
  refresh_token?: string;
  user?: {
    user_id: string;
    email: string;
    name?: string;
    fname?: string;
    lname?: string;
    picture?: string;
    user_type: string;
    is_profile_complete: boolean;
  };
}

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const getRoleBasedRedirectPath = (userType: string): string => {
    switch (userType) {
      case "admin":
        return "/admin/dashboard";
      case "doctor":
        return "/doctor/dashboard";
      case "staff":
        return "/staff/home";
      case "patient":
        return "/patient/home";
      default:
        return "/patient/home";
    }
  };

  // Handle Google Sign-Up success
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setLoading(true);
    setError("");

    try {
      const credential = credentialResponse.credential;
      if (!credential) throw new Error("Invalid Google credentials");

      const data: GoogleSignUpResponse = await googleSignUp(credential);
      
      // Validate response
      if (!data.access_token || !data.refresh_token || !data.user) {
        throw new Error("Invalid response from server");
      }
      
      // Prepare tokens object for AuthContext
      const tokens: Tokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
      
      // Map user_id to id for AuthContext compatibility
      const userDataForAuth: any = {
        id: data.user.user_id,
        name: data.user.name || data.user.fname || "",
        email: data.user.email,
        role: data.user.user_type,
        // Preserve all original user fields
        user_id: data.user.user_id,
        user_type: data.user.user_type,
        is_profile_complete: data.user.is_profile_complete,
      };

      // Only add optional fields if they exist
      if (data.user.picture) {
        userDataForAuth.picture = data.user.picture;
      }
      if (data.user.fname) {
        userDataForAuth.fname = data.user.fname;
      }
      if (data.user.lname) {
        userDataForAuth.lname = data.user.lname;
      }

      login(tokens, userDataForAuth);

      if (!data.user.is_profile_complete) {
        navigate("/complete-profile", {
          replace: true,
          state: {
            user_id: data.user.user_id,
            email: data.user.email,
            name: data.user.name,
            fname: data.user.fname,
            lname: data.user.lname,
            picture: data.user.picture,
          },
        });
      } else {
        const from = (location.state as any)?.from?.pathname;
        const redirectPath = from || getRoleBasedRedirectPath(data.user.user_type);
        navigate(redirectPath, { replace: true });
      }
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError(err.message || "Something went wrong during sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-Up failed. Please try again.");
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
            {/* Error message */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm mb-4">
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="bg-blue-500/20 border border-blue-400/50 text-blue-100 px-4 py-3 rounded-xl backdrop-blur-sm mb-4">
                Signing you up...
              </div>
            )}

            {/* Google Sign-Up Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                text="signup_with"
                shape="rectangular"
                size="large"
                width="100%"
                logo_alignment="left"
              />
            </div>

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

      {/* Footer */}
      <Footer />
    </div>
  );
}