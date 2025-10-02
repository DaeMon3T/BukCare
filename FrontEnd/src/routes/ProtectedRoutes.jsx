// ============================================================================
// 4. ProtectedRoutes.jsx - Role-Based Route Protection
// ============================================================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected Route Component
 * Protects routes based on authentication status and user roles
 * @param {React.ReactNode} children - Components to protect
 * @param {string[]} allowedRoles - Array of roles allowed to access this route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Get current auth state
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
  // Save current location so we can redirect back after login
  if (!isAuthenticated) {
  // if trying to access protected role routes, go to signin
    if (location.pathname.startsWith("/admin") ||
        location.pathname.startsWith("/doctor") ||
        location.pathname.startsWith("/staff") ||
        location.pathname.startsWith("/patient")) {
      return <Navigate to="/signin" replace />;
  }
  // otherwise just go to landing
  return <Navigate to="/" replace />;
}


  // Check if user's role is allowed for this specific route
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.user_type)) {
    // User is logged in but doesn't have the right role
    // Redirect them to their appropriate dashboard
    switch (user.user_type) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'staff':
        return <Navigate to="/staff/home" replace />;
      case 'patient':
        return <Navigate to="/patient/home" replace />;
      default:
        // Unknown role - send back to login
        return <Navigate to="/signin" replace />;
    }
  }

  // User is authenticated and has correct role - render the protected component
  return children;
};

// ============================================================================
// Role-Specific Route Components
// These provide convenient wrappers for common role-based protections
// ============================================================================

/**
 * Admin-only route protection
 * Only allows users with 'admin' role
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

/**
 * Doctor-only route protection
 * Only allows users with 'doctor' role
 */
export const DoctorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['doctor']}>{children}</ProtectedRoute>
);

/**
 * Staff-only route protection
 * Only allows users with 'staff' role
 */
export const StaffRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['staff']}>{children}</ProtectedRoute>
);

/**
 * Patient-only route protection
 * Only allows users with 'patient' role
 */
export const PatientRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['patient']}>{children}</ProtectedRoute>
);

/**
 * Generic authenticated route protection
 * Allows any authenticated user regardless of role
 * Useful for routes accessible to all logged-in users
 */
export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

export default ProtectedRoute;