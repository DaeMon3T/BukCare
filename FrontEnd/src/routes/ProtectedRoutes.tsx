// ============================================================================
// 4. ProtectedRoutes.tsx - Role-Based Route Protection
// ============================================================================
import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

// Define allowed roles
type UserRole = "admin" | "doctor" | "staff" | "patient";

// Define prop types
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Protected Route Component
 * Protects routes based on authentication status and user roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    // If trying to access protected routes, go to signin
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/doctor") ||
      location.pathname.startsWith("/staff") ||
      location.pathname.startsWith("/patient")
    ) {
      return <Navigate to="/signin" replace />;
    }
    // Otherwise go to landing page
    return <Navigate to="/" replace />;
  }

  // Check if user's role is allowed for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.user_type)) {
    switch (user?.user_type) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "doctor":
        return <Navigate to="/doctor/dashboard" replace />;
      case "staff":
        return <Navigate to="/staff/home" replace />;
      case "patient":
        return <Navigate to="/patient/home" replace />;
      default:
        return <Navigate to="/signin" replace />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

// ============================================================================
// Role-Specific Route Components
// ============================================================================

export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
);

export const DoctorRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["doctor"]}>{children}</ProtectedRoute>
);

export const StaffRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["staff"]}>{children}</ProtectedRoute>
);

export const PatientRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["patient"]}>{children}</ProtectedRoute>
);

export const AuthenticatedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ProtectedRoute>{children}</ProtectedRoute>;

export default ProtectedRoute;
