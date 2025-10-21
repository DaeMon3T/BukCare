import React from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Define allowed roles
type UserRole = "admin" | "doctor" | "patient";

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
    // Save the attempted location so we can redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Get user role - check both 'role' and 'user_type' fields
  const userRole = (user?.role || user?.user_type || "").toLowerCase();

  // Check if user's role is allowed for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole as UserRole)) {
    console.warn(
      `User role '${userRole}' not allowed for this route. Allowed roles:`,
      allowedRoles
    );

    // Redirect to appropriate dashboard based on user role
    switch (userRole) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "doctor":
        return <Navigate to="/doctor/dashboard" replace />;
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

export const PatientRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["patient"]}>{children}</ProtectedRoute>
);

export const AuthenticatedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => <ProtectedRoute>{children}</ProtectedRoute>;

export default ProtectedRoute;