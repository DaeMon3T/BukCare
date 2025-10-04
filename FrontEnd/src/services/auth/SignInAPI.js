// ============================================================================
// SignInAPI.js - Authentication API Service
// ============================================================================

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

/**
 * Sign in with email and password
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Authentication response with tokens and user data
 */
export const signIn = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Sign in failed');
    }

    const data = await response.json();
    
    // Expected response format:
    // {
    //   "tokens": {
    //     "access_token": "...",
    //     "refresh_token": "...",
    //     "token_type": "bearer",
    //     "expires_in": 1800
    //   },
    //   "user": {
    //     "user_id": 1,
    //     "email": "user@example.com",
    //     "fname": "John",
    //     "lname": "Doe",
    //     "user_type": "patient",
    //     "is_profile_complete": true,  // ← IMPORTANT: Backend must return this
    //     "is_verified": true,
    //     "is_active": true
    //   }
    // }
    
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

/**
 * Sign in with Google OAuth
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} Authentication response with tokens and user data
 */
export const signInWithGoogle = async (idToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Google sign in failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

/**
 * Refresh access token
 * @param {string} refreshToken - Valid refresh token
 * @returns {Promise<Object>} New tokens
 */
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Token refresh failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

/**
 * Sign out (client-side cleanup)
 */
export const signOut = () => {
  // Clear tokens from localStorage
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};