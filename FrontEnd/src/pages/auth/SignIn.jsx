  // ============================================================================
  // SignIn.jsx - Unified Authentication
  // Handles both Google OAuth and Email/Password login
  // ============================================================================
  import React, { useState } from 'react';
  import { Link, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '@/context/AuthContext';
  import { signIn } from '@/services/auth/SignInAPI';
  import { GoogleLogin } from '@react-oauth/google';
  import Footer from "@/components/Footer";

  const SignIn = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if (error) setError('');
    };

    const getRoleBasedRedirectPath = (userType) => {
      switch (userType) {
        case 'admin': return '/admin/dashboard';
        case 'doctor': return '/doctor/dashboard';
        case 'staff': return '/staff/home';
        case 'patient': return '/patient/home';
        default: return '/patient/home';
      }
    };

    // Common redirect logic for both login methods
    const handleLoginSuccess = (result) => {
      // Save tokens and user to context
      login(result.tokens, result.user);
      
      const userRole = result.user.user_type || result.user.role;

      // Check if profile is complete
      // is_profile_complete should be present for ALL users from backend
      if (result.user.is_profile_complete === false) {
        // Profile incomplete - redirect to complete profile
        navigate('/complete-profile', { 
          replace: true,
          state: { 
            user_id: result.user.user_id,
            email: result.user.email,
            name: result.user.name,
            fname: result.user.fname,
            lname: result.user.lname,
            picture: result.user.picture
          }
        });
      } else {
        // Profile complete - redirect to appropriate dashboard
        const from = location.state?.from?.pathname;
        const redirectPath = from || getRoleBasedRedirectPath(userRole);
        navigate(redirectPath, { replace: true });
      }
    };

    // Handle email/password sign-in
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const result = await signIn(formData);
        handleLoginSuccess(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Handle Google Sign-In
    const handleGoogleSuccess = async (credentialResponse) => {
      setLoading(true);
      setError('');

      try {
        const idToken = credentialResponse.credential;

        const res = await fetch('http://127.0.0.1:8000/api/v1/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || 'Google sign-in failed');
        }

        const data = await res.json();
        handleLoginSuccess(data);
      } catch (err) {
        setError(err.message || 'Google sign-in failed');
      } finally {
        setLoading(false);
      }
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
                Welcome <span className="text-[#FFC43D]">Back</span>
              </h1>
              <p className="text-lg text-white/90">
                Sign in to manage your healthcare appointments
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
              {/* Google Sign-In First */}
              <div className="mb-6">
                <div className="flex justify-center">
                  <div className="bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-sm">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Sign-In Failed')}
                      theme="filled_black"
                      size="large"
                      width="280"
                    />
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <hr className="flex-grow border-white/20" />
                <span className="px-4 text-white/60 text-sm font-medium">OR</span>
                <hr className="flex-grow border-white/20" />
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Error message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-[#FFC43D] hover:text-[#FFD84C] transition font-medium"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#FFD84C] transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1A1A40]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center mt-8 pt-6 border-t border-white/20">
                <span className="text-white/80">
                  Don't have an account?{' '}
                  <Link 
                    to="/signup" 
                    className="text-[#FFC43D] hover:text-[#FFD84C] transition font-semibold"
                  >
                    Sign up here
                  </Link>
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center mt-6">
              <p className="text-sm text-white/60">
                By signing in, you agree to our{' '}
                <Link to="/terms" className="text-[#FFC43D] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
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
  };

  export default SignIn;