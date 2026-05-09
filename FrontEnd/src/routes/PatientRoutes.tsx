// ============================================================================
// PatientRoutes.tsx - Patient-protected routes (wrapped in PatientLayout)
// ============================================================================
import { Route } from 'react-router-dom';
import { PatientRoute } from './ProtectedRoutes';

// Layout
import PatientLayout from '../layouts/PatientLayout';

// Patient Pages
import PatientDashboard from '../pages/patient/Dashboard';
import PatientAppointments from '../pages/patient/Appointments';
import PatientProfile from '../pages/patient/Profile';
import FindDoctor from '../pages/patient/FindDoctor';
import BookAppointment from '../pages/patient/BookAppointment';
import PatientMessages from '../pages/patient/Messages';
import ViewDoctorProfile from '../pages/patient/ViewDoctorProfile';
import MedicalProfileSettings from '../pages/patient/MedicalProfileSettings';

// Shared
import HospitalLocator from '../components/HospitalLocator';

const PatientRoutes = () => (
  <Route element={<PatientRoute><PatientLayout /></PatientRoute>}>
    <Route path="/patient/home" element={<PatientDashboard />} />
    <Route path="/patient/appointments" element={<PatientAppointments />} />
    <Route path="/patient/find-doctor" element={<FindDoctor />} />
    <Route path="/patient/book/:doctor_id" element={<BookAppointment />} />
    <Route path="/patient/profile" element={<PatientProfile />} />
    <Route path="/patient/messages" element={<PatientMessages />} />
    <Route path="/patient/doctor/:id" element={<ViewDoctorProfile />} />
    <Route path="/patient/locator" element={<HospitalLocator />} />
    <Route path="/patient/profile/edit" element={<MedicalProfileSettings />} />
  </Route>
);

export default PatientRoutes;
