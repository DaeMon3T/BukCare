// ============================================================================
// 1. AuthContext.jsx - Global Authentication State Management
// ============================================================================
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create authentication context - this will store and share auth state across the app
const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 * Ensures components using auth are wrapped in AuthProvider
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps the entire app to provide auth state to all components
 * @param {Object} children - Child components to wrap
 */
export const AuthProvider = ({ children }) => {
  // Current user data (null if not authenticated)
  const [user, setUser] = useState(null);
  // Loading state to show spinner during auth checks
  const [loading, setLoading] = useState(true);

  /**
   * Check for existing authentication data on app startup
   * This allows users to stay logged in after page refresh
   */
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Remove corrupted data
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  /**
   * Login function
   * Stores access & refresh tokens in localStorage and updates user state
   * @param {Object} tokens - { access_token: string, refresh_token: string }
   * @param {Object} userData - User info (id, name, email, role, picture, etc.)
   */
  const login = (tokens, userData) => {
    localStorage.setItem('access_token', tokens.access_token);   // ✅ fixed
    localStorage.setItem('refresh_token', tokens.refresh_token); // ✅ fixed
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  /**
   * Logout function
   * Clears frontend storage and calls backend to invalidate refresh token
   * Ensures user is fully logged out both client-side and server-side
   */
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Logout failed on backend:', response.status);
        }
      }
    } catch (error) {
      console.error('Error logging out on backend:', error);
    } finally {
      localStorage.clear(); // ✅ clears all auth data
      setUser(null);
      window.location.href = '/';
    }
  };

  // Context value object provided to all child components
  const value = {
    user,                    // Current user data
    login,                   // Login function
    logout,                  // Logout function
    loading,                 // Loading state
    isAuthenticated: !!user, // Boolean: true if user exists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
