// src/components/auth/GoogleCallbackHandler.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';

const GoogleCallbackHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) {
      console.log('Callback already processed, skipping...');
      return;
    }
    hasProcessed.current = true;

    const handleGoogleCallback = async () => {
      
      const searchParams = new URLSearchParams(location.search);
      const hashParams = new URLSearchParams(location.hash.substring(1));
      
      const getParam = (key: string): string | null => {
        return searchParams.get(key) || hashParams.get(key);
      };
      
      const token = getParam('token') || getParam('access_token');
      const refresh = getParam('refresh') || getParam('refresh_token');
      const error = getParam('error');

      if (token) {
        console.log('  ✓ Token Preview:', token.substring(0, 20) + '...');
      }

      if (error) {
        console.error('OAuth Error Detected:', error);
        const errorDescription = getParam('error_description') || error;
        toast.error(`Google Sign-In failed: ${decodeURIComponent(errorDescription)}`);
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
        return;
      }

      if (!token || !refresh) {
        console.error('Missing Authentication Tokens');
        toast.error('Authentication failed: Missing tokens');
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
        return;
      }

      try {
        const user_id = getParam('user_id');
        const email = getParam('email');
        const fname = getParam('fname');
        const lname = getParam('lname');
        const picture = getParam('picture');
        const role = getParam('role');
        const is_profile_complete = getParam('is_profile_complete');
        const is_verified = getParam('is_verified');
        const is_active = getParam('is_active');

        if (!user_id || !email) {
          throw new Error('Missing required user information (user_id or email)');
        }

        const parsedUserId = parseInt(user_id, 10);
        if (isNaN(parsedUserId)) {
          throw new Error('Invalid user_id format');
        }

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
        
        login(tokens, user);
        
        let redirectPath = '/';
        
        if (!user.is_profile_complete) {
          toast('Please complete your profile to continue', { 
            duration: 4000
          });
          
          redirectPath = '/complete-profile';
          
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

        const userRole = (user.role || '').toLowerCase();
        
        switch (userRole) {
          case 'admin':
            redirectPath = '/admin/dashboard';
            break;
          case 'doctor':
            redirectPath = '/doctor/dashboard';
            break;
          case 'patient':
            redirectPath = '/patient/home';
            break;
          case 'staff':
            redirectPath = '/staff/dashboard';
            break;
          default:
            redirectPath = '/signin';
            toast.error('Unknown user role. Please contact support.');
        }

        console.log('🔀 Redirecting to:', redirectPath);
        
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 500);

      } catch (err: any) {
        console.error('Error Processing Google Callback', err);
        toast.error(`Failed to process sign-in: ${err.message}`);
        
        setTimeout(() => {
          navigate('/signin', { replace: true });
        }, 2000);
      }
    };

    handleGoogleCallback();
  }, []);

  return (
    // ✨ GLASSMORPHISM BACKGROUND WRAPPER
    <div className="min-h-screen bg-[#F0F4F8] relative overflow-hidden font-sans text-slate-800 flex items-center justify-center">
      
      {/* 🎨 AMBIENT BACKGROUND BLOBS */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      {/* GLASS CARD */}
      <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-10 max-w-md w-full text-center mx-4">
        
        {/* Animated Icon */}
        <div className="relative inline-block mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md">
                <ShieldCheck className="w-5 h-5 text-emerald-500 fill-current" />
            </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">Completing Sign-In</h2>
        <p className="text-slate-500 text-lg mb-8">Please wait a moment while we secure your session...</p>

        <div className="bg-white/50 rounded-xl p-4 border border-white/60">
            <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Authenticating with Google
            </p>
        </div>

        <p className="text-xs text-slate-400 mt-6">
            If this takes longer than expected, please refresh the page.
        </p>
      </div>
    </div>
  );
};

export default GoogleCallbackHandler;