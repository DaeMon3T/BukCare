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

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData);
        setUser(parsedUser);
      } catch {
        localStorage.clear();
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
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

  // Logout
  const logout = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
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
