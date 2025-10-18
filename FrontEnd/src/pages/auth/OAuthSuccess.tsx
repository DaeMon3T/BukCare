// src/pages/auth/OAuthSuccess.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const OAuthSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const access_token = params.get("token");
    const refresh_token = params.get("refresh");
    const user_id = params.get("user_id");
    const email = params.get("email");
    const fname = params.get("fname");
    const lname = params.get("lname");
    const picture = params.get("picture");
    const role = params.get("role");
    const is_profile_complete = params.get("is_profile_complete");

    if (!access_token || !refresh_token || !user_id || !email) {
      return navigate("/signin", { replace: true });
    }

    // Store in AuthContext / localStorage
    login(
      { access_token, refresh_token },
      { id: user_id, email, fname, lname, picture, role }
    );

    // Redirect based on role / profile completeness
    if (role?.toLowerCase() === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role?.toLowerCase() === "doctor") navigate("/doctor/dashboard", { replace: true });
    else if (role?.toLowerCase() === "patient") {
      if (is_profile_complete === "false") navigate("/complete-profile", { replace: true });
      else navigate("/patient/home", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [location.search, login, navigate]);

  return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
};

export default OAuthSuccess;
