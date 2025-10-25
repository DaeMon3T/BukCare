// API Interceptor for centralized error handling and token management

class APIInterceptor {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Ensure baseURL doesn't end with slash
    this.baseURL = this.baseURL.replace(/\/$/, '');
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    const token = localStorage.getItem('access_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0) {
        const refreshSuccess = await this.refreshToken();
        
        if (refreshSuccess) {
          // Retry the request with new token
          return this.makeRequest(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed, redirect to login
          localStorage.clear();
          window.location.href = '/signin';
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }

  async patch(endpoint: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) return false;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
      } else {
        localStorage.clear();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.clear();
      return false;
    }
  }
}

// Export singleton instance
export const api = new APIInterceptor();
export default api;
