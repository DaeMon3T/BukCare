// ============================================================================
// StaffRoutes.tsx - Staff-protected routes (reuses DoctorLayout)
// ============================================================================
import { Route } from 'react-router-dom';
import { StaffRoute } from './ProtectedRoutes';

// Layout (shared with doctor)
import DoctorLayout from '../layouts/DoctorLayout';

// Staff Pages
import WalkIn from '../pages/staff/WalkIn';
import StaffDashboard from '../pages/staff/Dashboard';
import StaffAppointments from '../pages/staff/Appointments';
import StaffProfile from '../pages/staff/Profile';

// Shared (doctor) pages used by staff
import Messages from '../pages/doctor/Messages';
import ScanPatient from '../pages/doctor/ScanPatient';
import PatientDetails from '../pages/doctor/PatientDetails';

const StaffRoutes = () => (
  <Route element={<StaffRoute><DoctorLayout /></StaffRoute>}>
    <Route path="/staff/dashboard" element={<StaffDashboard />} />
    <Route path="/staff/appointments" element={<StaffAppointments />} />
    <Route path="/staff/profile" element={<StaffProfile />} />
    <Route path="/staff/messages" element={<Messages />} />
    <Route path="/staff/scan" element={<ScanPatient />} />
    <Route path="/staff/patient/:id" element={<PatientDetails />} />
    <Route path="/staff/walk-in" element={<WalkIn />} />
  </Route>
);

export default StaffRoutes;
