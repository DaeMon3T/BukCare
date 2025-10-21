// src/components/auth/GoogleCallbackHandler.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

const GoogleCallbackHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasProcessed.current) {
      console.log('⚠️ Callback already processed, skipping...');
      return;
    }
    hasProcessed.current = true;

    const handleGoogleCallback = async () => {
      console.log('========================================');
      console.log('🔐 Google OAuth Callback Handler Started');
      console.log('========================================');
      console.log('📍 Current URL:', window.location.href);
      console.log('📍 Pathname:', location.pathname);
      console.log('📍 Search:', location.search);
      
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1));
      
      // Helper to get param from either search or hash
      const getParam = (key: string): string | null => {
        return searchParams.get(key) || hashParams.get(key);
      };
      
      // Extract tokens
      const token = getParam('token') || getParam('access_token');
      const refresh = getParam('refresh') || getParam('refresh_token');
      const error = getParam('error');

      console.log('📦 Extracted Parameters:');
      console.log('  ✓ Has Access Token:', !!token);
      console.log('  ✓ Has Refresh Token:', !!refresh);
      console.log('  ✓ Error:', error || 'None');
      
      if (token) {
        console.log('  ✓ Token Preview:', token.substring(0, 20) + '...');
      }

      // Handle OAuth error
      if (error) {
        console.error('❌ OAuth Error Detected:', error);
        const errorDescription = getParam('error_description') || error;
        toast.error(`Google Sign-In failed: ${decodeURIComponent(errorDescription)}`);
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
        return;
      }

      // Validate required tokens
      if (!token || !refresh) {
        console.error('❌ Missing Authentication Tokens');
        console.log('Available URL params:', Array.from(searchParams.keys()));
        toast.error('Authentication failed: Missing tokens');
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
        return;
      }

      try {
        // Extract user data from URL
        const user_id = getParam('user_id');
        const email = getParam('email');
        const fname = getParam('fname');
        const lname = getParam('lname');
        const picture = getParam('picture');
        const role = getParam('role');
        const is_profile_complete = getParam('is_profile_complete');
        const is_verified = getParam('is_verified');
        const is_active = getParam('is_active');

        console.log('👤 User Data from URL:');
        console.log('  ✓ User ID:', user_id);
        console.log('  ✓ Email:', email);
        console.log('  ✓ First Name:', fname);
        console.log('  ✓ Last Name:', lname);
        console.log('  ✓ Picture:', picture ? 'Yes' : 'No');
        console.log('  ✓ Role:', role || 'Not set');
        console.log('  ✓ Profile Complete:', is_profile_complete);
        console.log('  ✓ Verified:', is_verified);
        console.log('  ✓ Active:', is_active);

        // Validate required user data
        if (!user_id || !email) {
          throw new Error('Missing required user information (user_id or email)');
        }

        // Parse user_id safely
        const parsedUserId = parseInt(user_id, 10);
        if (isNaN(parsedUserId)) {
          throw new Error('Invalid user_id format');
        }

        // Construct user object
        const user = {
          user_id: parsedUserId,
          email: decodeURIComponent(email),
          fname: fname ? decodeURIComponent(fname) : '',
          lname: lname ? decodeURIComponent(lname) : '',
          picture: picture ? decodeURIComponent(picture) : undefined,
          role: role && role !== '' ? decodeURIComponent(role) : null,
          is_profile_complete: is_profile_complete === 'true',
          is_verified: is_verified === 'true',
          is_active: is_active === 'true'
        };

        const tokens = {
          access_token: token,
          refresh_token: refresh,
          token_type: 'bearer',
          expires_in: 3600
        };

        console.log('✅ Processed User Object:');
        console.log('  User ID:', user.user_id);
        console.log('  Email:', user.email);
        console.log('  Name:', `${user.fname} ${user.lname}`);
        console.log('  Role:', user.role || 'None (needs profile completion)');
        console.log('  Profile Complete:', user.is_profile_complete);
        
        // Login user (stores tokens and user data)
        console.log('🔐 Logging in user...');
        login(tokens, user);
        console.log('✅ Login successful - tokens and user data stored');

        // Show welcome message
        const displayName = user.fname || 'User';
        toast.success(`Welcome, ${displayName}!`, {
          duration: 3000,
          icon: '👋'
        });
        
        // Determine redirect path
        let redirectPath = '/';
        
        if (!user.is_profile_complete) {
          console.log('📝 Profile is incomplete');
          console.log('🔀 Redirecting to: /complete-profile');
          
          toast('Please complete your profile to continue', { 
            icon: '📝',
            duration: 4000
          });
          
          redirectPath = '/complete-profile';
          
          // Navigate with user state for profile completion
          setTimeout(() => {
            navigate(redirectPath, {
              replace: true,
              state: {
                user_id: user.user_id,
                email: user.email,
                fname: user.fname,
                lname: user.lname,
                picture: user.picture
              }
            });
          }, 500);
          return;
        }

        // Profile is complete - route by role
        console.log('✅ Profile is complete');
        const userRole = (user.role || '').toLowerCase();
        
        switch (userRole) {
          case 'admin':
            redirectPath = '/admin/dashboard';
            console.log('👔 User is Admin');
            break;
          case 'doctor':
            redirectPath = '/doctor/dashboard';
            console.log('⚕️ User is Doctor');
            break;
          case 'patient':
            redirectPath = '/patient/home';
            console.log('🧑‍⚕️ User is Patient');
            break;
          default:
            redirectPath = '/';
            console.warn('⚠️ Unknown or missing role:', userRole);
            toast.error('Unknown user role. Please contact support.', {
              duration: 5000
            });
        }

        console.log('🔀 Redirecting to:', redirectPath);
        console.log('========================================');
        
        // Navigate after a short delay to ensure state is updated
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 500);

      } catch (err: any) {
        console.error('========================================');
        console.error('❌ Error Processing Google Callback');
        console.error('========================================');
        console.error('Error:', err);
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
        
        toast.error(`Failed to process sign-in: ${err.message}`, {
          duration: 5000
        });
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
      }
    };

    handleGoogleCallback();
  }, []); // Run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] flex items-center justify-center">
      <div className="text-center text-white max-w-md px-6">
        {/* Loading Spinner */}
        <div className="relative inline-block mb-6">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[#FFC43D]"></div>
          <div className="absolute inset-0 rounded-full h-20 w-20 border-t-4 border-white/20 animate-pulse"></div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-3 text-white">
          Completing Sign-In
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-white/90 mb-4">
          Please wait while we complete your Google Sign-In...
        </p>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-white/70">
            🔐 Securely authenticating your account
          </p>
          <p className="text-sm text-white/70 mt-1">
            📝 Preparing your profile
          </p>
        </div>

        {/* Help Text */}
        <p className="text-xs text-white/60 mt-6">
          If this takes longer than expected, please try refreshing the page
        </p>
      </div>
    </div>
  );
};

export default GoogleCallbackHandler;