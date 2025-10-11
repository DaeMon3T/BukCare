import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import type { ReactNode } from "react"; // ✅ type-only import

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface UserData {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  picture?: string;
  [key: string]: any; // for extra user fields
}

interface AuthContextType {
  user: UserData | null;
  login: (tokens: Tokens, userData: UserData) => void;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps the entire app to provide auth state to all components
 */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.clear();
      }
    }

    setLoading(false);
  }, []);

  const login = (tokens: Tokens, userData: UserData) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/logout`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error("Logout failed on backend:", response.status);
        }
      }
    } catch (error) {
      console.error("Error logging out on backend:", error);
    } finally {
      localStorage.clear();
      setUser(null);
      window.location.href = "/";
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;
