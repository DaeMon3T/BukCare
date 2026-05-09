// ============================================================================
// DoctorRoutes.tsx - Doctor-protected routes (wrapped in DoctorLayout)
// ============================================================================
import { Route } from 'react-router-dom';
import { DoctorRoute } from './ProtectedRoutes';

// Layout
import DoctorLayout from '../layouts/DoctorLayout';

// Doctor Pages
import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorAppointments from '../pages/doctor/Appointments';
import DoctorProfile from '../pages/doctor/Profile';
import DoctorSetAvailability from '../pages/doctor/SetAvailability';
import Messages from '../pages/doctor/Messages';
import ScanPatient from '../pages/doctor/ScanPatient';
import PatientDetails from '../pages/doctor/PatientDetails';
import ManageStaffAccess from '../pages/doctor/ManageStaffAccess';

const DoctorRoutes = () => (
  <Route element={<DoctorRoute><DoctorLayout /></DoctorRoute>}>
    <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
    <Route path="/doctor/appointments" element={<DoctorAppointments />} />
    <Route path="/doctor/set-availability" element={<DoctorSetAvailability />} />
    <Route path="/doctor/profile" element={<DoctorProfile />} />
    <Route path="/doctor/messages" element={<Messages />} />
    <Route path="/doctor/scan" element={<ScanPatient />} />
    <Route path="/doctor/patient/:id" element={<PatientDetails />} />
    <Route path="/doctor/manage-staff" element={<ManageStaffAccess />} />
  </Route>
);

export default DoctorRoutes;
