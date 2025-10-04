// ============================================================================
// CompleteProfile.jsx - Collect additional user data after Google OAuth
// Shows Google-provided data at top, collects missing information
// ============================================================================
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Footer from "@/components/Footer";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // Get user_id and Google data from auth context or location state
  const userId = user?.user_id || location.state?.user_id;
  const googleData = {
    email: user?.email || location.state?.email || '',
    name: user?.name || location.state?.name || '',
    fname: user?.fname || location.state?.fname || '',
    lname: user?.lname || location.state?.lname || '',
    picture: user?.picture || location.state?.picture || '',
  };

  const [formData, setFormData] = useState({
    sex: '',
    dob: '',
    contact_number: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ Validate required password
    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        user_id: userId,
        sex: formData.sex,
        dob: formData.dob,
        contact_number: formData.contact_number,
        address_id: null,
        password: formData.password, // ✅ required now
      };
      console.log("Payload being sent:", payload);
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to complete profile');
      }

      const data = await res.json();

      // Update auth context with new tokens and complete profile
      login(data.tokens, data.user);

      // Redirect to patient home
      navigate('/patient/home', { replace: true });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-xl">
              Complete Your <span className="text-[#FFC43D]">Profile</span>
            </h1>
            <p className="text-lg text-white/90">
              Just a few more details to get you started
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            
            {/* Google Account Info Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {googleData.picture ? (
                  <img 
                    src={googleData.picture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full border-2 border-[#FFC43D]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FFC43D] flex items-center justify-center text-[#1A1A40] font-bold text-2xl">
                    {googleData.fname?.charAt(0)}{googleData.lname?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">
                    {googleData.name || `${googleData.fname} ${googleData.lname}`}
                  </h3>
                  <p className="text-white/80 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {googleData.email}
                  </p>
                </div>
                <div className="bg-green-500/20 border border-green-400/50 px-3 py-1 rounded-full">
                  <span className="text-green-300 text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/60 italic">
                Connected with Google • Email verified automatically
              </p>
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

              {/* Section Title */}
              <div className="pt-4">
                <h3 className="text-lg font-bold text-white/90 mb-1">
                  Additional Information
                </h3>
                <p className="text-sm text-white/60">
                  Help us provide better healthcare services
                </p>
              </div>

              {/* Sex */}
              <div>
                <label htmlFor="sex" className="block text-sm font-semibold text-white/90 mb-2">
                  Sex <span className="text-red-400">*</span>
                </label>
                <select
                  id="sex"
                  name="sex"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                  value={formData.sex}
                  onChange={handleChange}
                    >
                      <option value="">Select your sex</option>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-semibold text-white/90 mb-2">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                  value={formData.dob}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Contact Number */}
              <div>
                <label htmlFor="contact_number" className="block text-sm font-semibold text-white/90 mb-2">
                  Contact Number <span className="text-red-400">*</span>
                </label>
                <input
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                  placeholder="09XX XXX XXXX"
                  value={formData.contact_number}
                  onChange={handleChange}
                  pattern="[0-9]{10,11}"
                />
                <p className="text-xs text-white/60 mt-2">
                  Enter 10-11 digit phone number
                </p>
              </div>

              {/* Password Section */}
              <div className="pt-4">
                <h3 className="text-lg font-bold text-white/90 mb-2">Account Security</h3>
                <p className="text-sm text-white/60">
                  Please set a secure password to continue
                </p>
              </div>

              {/* Password (Required) */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Confirm Password (Required) */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white/90 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent backdrop-blur-sm transition"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#FFD84C] transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-8"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#1A1A40]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Profile...
                  </div>
                ) : (
                  'Complete Profile & Continue'
                )}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              All fields marked with <span className="text-red-400">*</span> are required
            </p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CompleteProfile;
