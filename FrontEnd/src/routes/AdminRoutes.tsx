// ============================================================================
// AdminRoutes.tsx - Admin-protected routes
// ============================================================================
import { Route } from 'react-router-dom';
import { AdminRoute } from './ProtectedRoutes';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProfile from '../pages/admin/Profile';
import AdminUsers from '../pages/admin/Users';
import Usersdetail from '../pages/admin/Usersdetail';

const AdminRoutes = () => (
  <>
    <Route
      path="/admin/dashboard"
      element={<AdminRoute><AdminDashboard /></AdminRoute>}
    />
    <Route
      path="/admin/users"
      element={<AdminRoute><AdminUsers /></AdminRoute>}
    />
    <Route
      path="/admin/users/:id"
      element={<AdminRoute><Usersdetail /></AdminRoute>}
    />
    <Route
      path="/admin/profile"
      element={<AdminRoute><AdminProfile /></AdminRoute>}
    />
  </>
);

export default AdminRoutes;
