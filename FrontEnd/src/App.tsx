// ============================================================================
// App.tsx - Full Routes with OAuth Success + Toast Notifications
// ============================================================================
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // ✅ Added
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, DoctorRoute, PatientRoute } from './routes/ProtectedRoutes';

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

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorProfile from './pages/doctor/Profile';

// Patient Pages
import PatientHome from './pages/patient/Home';
import PatientAppointments from './pages/patient/Appointments';
import PatientProfile from './pages/patient/Profile';
import FindDoctor from './pages/patient/FindDoctor';

// --------------------
// App Component
// --------------------
const App: FC = () => {
  return (
    <AuthProvider>
      <Router>
        {/* ✅ Toasts appear globally */}
        <Toaster position="top-center" reverseOrder={false} />

        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Auth Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/auth/success" element={<OAuthSuccess />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={<AdminRoute><AdminDashboard /></AdminRoute>}
            />
            <Route
              path="/admin/profile"
              element={<AdminRoute><AdminProfile /></AdminRoute>}
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={<DoctorRoute><DoctorDashboard /></DoctorRoute>}
            />
            <Route
              path="/doctor/appointments"
              element={<DoctorRoute><DoctorAppointments /></DoctorRoute>}
            />
            <Route
              path="/doctor/profile"
              element={<DoctorRoute><DoctorProfile /></DoctorRoute>}
            />

            {/* Patient Routes */}
            <Route
              path="/patient/home"
              element={<PatientRoute><PatientHome /></PatientRoute>}
            />
            <Route
              path="/patient/appointments"
              element={<PatientRoute><PatientAppointments /></PatientRoute>}
            />
            <Route
              path="/patient/profile"
              element={<PatientRoute><PatientProfile /></PatientRoute>}
            />
            <Route
              path="/patient/find-doctor"
              element={<PatientRoute><FindDoctor /></PatientRoute>}
            />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
