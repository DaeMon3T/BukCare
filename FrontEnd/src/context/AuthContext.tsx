import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";

interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface UserData {
  id?: number | string;
  user_id?: number | string;
  name?: string;
  fname?: string;
  lname?: string;
  email: string;
  role?: string;
  picture?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  login: (tokens: Tokens, userData: UserData) => void;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Clear only auth-related storage on logout/expiry. Using localStorage.clear()
// would also wipe unrelated app state (e.g. the onboarding "seen" flag), which
// would make first-run tours re-appear after every logout.
const clearAuthStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_data");
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔒 StrictMode-safe guard
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user_data");

      if (token && userData) {
        try {
          const parsedUser: UserData = JSON.parse(userData);

          // ✅ Safe JWT parsing
          const parts = token.split(".");
          if (parts.length !== 3) throw new Error("Invalid token");

          const payloadPart = parts[1];
          if (!payloadPart) throw new Error("Invalid token payload");

          const payload = JSON.parse(atob(payloadPart));
          const now = Date.now() / 1000;

          if (payload.exp && payload.exp < now) {
            clearAuthStorage();
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch (err) {
          console.error("Auth init failed:", err);
          clearAuthStorage();
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login
  const login = (tokens: Tokens, userData: UserData) => {
    const fullName =
      userData.name ||
      `${userData.fname || ""} ${userData.lname || ""}`.trim() ||
      "Guest";

    const formattedUser: UserData = {
      ...userData,
      id: userData.user_id ?? userData.id ?? Date.now(),
      name: fullName,
      picture: userData.picture || "/default-avatar.png",
    };

    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("user_data", JSON.stringify(formattedUser));

    setUser(formattedUser);
  };

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) return false;

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (!res.ok) throw new Error("Refresh failed");

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAuthStorage();
      setUser(null);
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (token) {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
        await fetch(`${apiUrl}/v1/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      refreshToken,
      loading,
      isAuthenticated: !!user,
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
