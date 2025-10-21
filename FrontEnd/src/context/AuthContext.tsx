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
  id: number | string;
  name: string;
  email: string;
  role?: string;
  picture?: string;
  [key: string]: any;
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
 */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized) {
      console.log("AuthContext: Already initialized, skipping");
      return;
    }

    console.log("AuthContext: Initializing...");
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user_data");

    console.log("AuthContext: Found token?", !!token);
    console.log("AuthContext: Found userData?", !!userData);

    if (token && userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData);
        console.log("AuthContext: Setting user:", parsedUser.email);
        setUser(parsedUser);
      } catch (error) {
        console.error("AuthContext: Error parsing user data:", error);
        localStorage.clear();
        setUser(null);
      }
    } else {
      console.log("AuthContext: No valid session found");
      setUser(null);
    }

    setLoading(false);
    setInitialized(true);
    console.log("AuthContext: Initialization complete");
  }, [initialized]);

  const login = (tokens: Tokens, userData: UserData) => {
    console.log("AuthContext: login() called for:", userData.email);
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setUser(userData);
    console.log("AuthContext: User logged in successfully");
  };

  const logout = async () => {
    console.log("AuthContext: logout() called");
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
      console.log("AuthContext: Clearing session and redirecting to /");
      localStorage.clear();
      setUser(null);
      // Only redirect to homepage when explicitly logging out
      window.location.href = "/";
    }
  };

  const value: AuthContextType = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  if (loading) {
    console.log("AuthContext: Still loading...");
  } else {
    console.log("AuthContext: Ready - isAuthenticated:", !!user);
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export default AuthContext;