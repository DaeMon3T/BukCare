import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface UserData {
  id?: number | string | undefined;
  user_id?: number | string | undefined;
  name?: string | undefined;
  fname?: string | undefined;
  lname?: string | undefined;
  email: string;
  role?: string | undefined;
  picture?: string | undefined;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  login: (tokens: Tokens, userData: UserData) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount with token validation
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user_data");

      if (token && userData) {
        try {
          const parsedUser: UserData = JSON.parse(userData);
          
          // Validate token is not expired
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          const tokenPayload = JSON.parse(atob(tokenParts[1] || ''));
          const currentTime = Date.now() / 1000;
          
          if (tokenPayload.exp && tokenPayload.exp < currentTime) {
            // Token expired, clear storage
            localStorage.clear();
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error("Error parsing stored auth data:", error);
          localStorage.clear();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // ✅ Combine name fields and ensure consistent shape
  const login = (tokens: Tokens, userData: UserData) => {
    const fullName =
      userData.name ||
      `${userData.fname || ""} ${userData.lname || ""}`.trim() ||
      "Guest";

    const formattedUser: UserData = {
      ...userData,
      id: userData.user_id ?? userData.id ?? Date.now(), // always has a valid id
      name: fullName,
      picture: userData.picture || "/default-avatar.png",
    };

    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("user_data", JSON.stringify(formattedUser));

    setUser(formattedUser);
  };

  // Token refresh function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh_token");
      if (!refreshTokenValue) return false;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        return true;
      } else {
        localStorage.clear();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      localStorage.clear();
      setUser(null);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.clear();
      setUser(null);
      window.location.href = "/";
    }
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      refreshToken,
      loading,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
