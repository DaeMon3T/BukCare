// ============================================================================
// App.tsx - Full Routes with Google Callback Handler and User Details
// ============================================================================
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { AdminRoute, DoctorRoute, PatientRoute, StaffRoute } from './routes/ProtectedRoutes';
import ErrorBoundary from './components/ErrorBoundary';
import { CallProvider } from './context/CallContext';

// Auth Components
import GoogleCallbackHandler from './components/auth/GoogleCallbackHandler';

// Auth Pages
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import CompleteProfile from './pages/auth/CompleteProfile/CompleteProfile';
import OAuthSuccess from './pages/auth/OAuthSuccess';

// Public Pages
import Landing from './pages/public/Landing';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Services from './pages/public/Services';
import Terms from './pages/public/Terms';
import Privacy from './pages/public/Privacy';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfile from './pages/admin/Profile';
import AdminUsers from './pages/admin/Users';
import Usersdetail from './pages/admin/Usersdetail';
import AdminAppointments from './pages/admin/Appointments';

// Doctor Pages
import DoctorLayout from './layouts/DoctorLayout';
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorProfile from './pages/doctor/Profile';
import DoctorSetAvailability from './pages/doctor/SetAvailability';
import Messages from './pages/doctor/Messages';
import ScanPatient from './pages/doctor/ScanPatient';
import PatientDetails from './pages/doctor/PatientDetails';
import ManageStaffAccess from './pages/doctor/ManageStaffAccess';

// Staff Pages
import WalkIn from './pages/staff/WalkIn';
import StaffDashboard from './pages/staff/Dashboard';
import StaffAppointments from './pages/staff/Appointments';
import StaffProfile from './pages/staff/Profile';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import PatientProfile from './pages/patient/Profile';
import FindDoctor from './pages/patient/FindDoctor';
import BookAppointment from './pages/patient/BookAppointment';
import PatientMessages from './pages/patient/Messages';
import HospitalLocator from './components/HospitalLocator';
import ViewDoctorProfile from "./pages/patient/ViewDoctorProfile";
import MedicalProfileSettings from './pages/patient/MedicalProfileSettings';
import PatientLayout from './layouts/PatientLayout';

// --------------------
// App Component
// --------------------
const App: FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/*
          Now WebSocketProvider is inside Router, allowing it to use navigation hooks if needed.
        */}
        <Router>
          <WebSocketProvider>
            <CallProvider>
            <Toaster position="top-center" reverseOrder={false} />

            <div className="App">
              <Routes>
                {/* -------------------- Public Routes -------------------- */}
                <Route path="/" element={<Landing />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />

                {/* -------------------- Auth Routes -------------------- */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />

                {/* Google OAuth Callback Handler */}
                <Route path="/auth/callback" element={<GoogleCallbackHandler />} />
                <Route path="/auth/success" element={<OAuthSuccess />} />

                {/* -------------------- Admin Routes -------------------- */}
                <Route
                  path="/admin/dashboard"
                  element={<AdminRoute><AdminDashboard /></AdminRoute>}
                />
                <Route
                  path="/admin/appointments"
                  element={<AdminRoute><AdminAppointments /></AdminRoute>}
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

                {/* -------------------- Doctor Routes -------------------- */}
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

                {/* -------------------- Staff Routes -------------------- */}
                <Route element={<StaffRoute><DoctorLayout /></StaffRoute>}>
                  <Route path="/staff/dashboard" element={<StaffDashboard />} />
                  <Route path="/staff/appointments" element={<StaffAppointments />} />
                  <Route path="/staff/profile" element={<StaffProfile />} />
                  <Route path="/staff/messages" element={<Messages />} />
                  <Route path="/staff/scan" element={<ScanPatient />} />
                  <Route path="/staff/patient/:id" element={<PatientDetails />} />
                  <Route path="/staff/walk-in" element={<WalkIn />} />
                </Route>

                {/* -------------------- Patient Routes -------------------- */}
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

                {/* -------------------- Catch-All -------------------- */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            </CallProvider>
          </WebSocketProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;