const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const OAuthAPI = {
  // Initiate Google OAuth login
  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  },

  // Exchange OAuth callback token
  handleOAuthCallback: async (token) => {
    try {
      // Store the token
      localStorage.setItem('access_token', token);

      // Verify token and get user info
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      return await response.json();
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }
};
