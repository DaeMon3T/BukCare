// ============================================================================
// App.tsx - Updated with Role-Based Routing
// ============================================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { AdminRoute, DoctorRoute, StaffRoute, PatientRoute } from './routes/ProtectedRoutes.js';

// Auth Pages
import SignIn from './pages/auth/SignIn.js';
import SignUp from './pages/auth/SignUp.js';
import ForgotPassword from './pages/auth/ForgotPassword.js';
import CompleteProfile from './pages/auth/CompleteProfile.js'; 

// Public Pages
import Landing from './pages/public/Landing.js';
import About from './pages/public/About.js';
import Contact from './pages/public/Contact.js';
import Services from './pages/public/Services.js';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.js';
import AdminProfile from './pages/admin/Profile.js';

// Doctor Pages
import DoctorSignUp from './pages/doctor/SignUp.js';   // ✅ add this
import DoctorDashboard from './pages/doctor/Dashboard.js';
import DoctorAppointments from './pages/doctor/Appointments.js';
import DoctorProfile from './pages/doctor/Profile.js';

// Staff Pages
import StaffHome from './pages/staff/Home.jsx';
import StaffAppointments from './pages/staff/Appointments.jsx';
import StaffProfile from './pages/staff/Profile.jsx';

// Patient Pages
import PatientHome from './pages/patient/Home.js';
import PatientAppointments from './pages/patient/Appointments.js';
import PatientProfile from './pages/patient/Profile.js';

// Type for React components (if needed for more complex scenarios)
type ReactComponent = React.ComponentType<any>;

function App(): JSX.Element {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            
            {/* Auth Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/admin/profile" 
              element={
                <AdminRoute>
                  <AdminProfile />
                </AdminRoute>
              } 
            />

            {/* Doctor Routes */}
            <Route path="/doctor/signup" element={<DoctorSignUp />} />
            <Route 
              path="/doctor/dashboard" 
              element={
                <DoctorRoute>
                  <DoctorDashboard />
                </DoctorRoute>
              } 
            />
            <Route 
              path="/doctor/appointments" 
              element={
                <DoctorRoute>
                  <DoctorAppointments />
                </DoctorRoute>
              } 
            />
            <Route 
              path="/doctor/profile" 
              element={
                <DoctorRoute>
                  <DoctorProfile />
                </DoctorRoute>
              } 
            />
            
            {/* Staff Routes */}
            <Route 
              path="/staff/home" 
              element={
                <StaffRoute>
                  <StaffHome />
                </StaffRoute>
              } 
            />
            <Route 
              path="/staff/appointments" 
              element={
                <StaffRoute>
                  <StaffAppointments />
                </StaffRoute>
              } 
            />
            <Route 
              path="/staff/profile" 
              element={
                <StaffRoute>
                  <StaffProfile />
                </StaffRoute>
              } 
            />
            
            {/* Patient Routes */}
            <Route 
              path="/patient/home" 
              element={
                <PatientRoute>
                  <PatientHome />
                </PatientRoute>
              } 
            />
            <Route 
              path="/patient/appointments" 
              element={
                <PatientRoute>
                  <PatientAppointments />
                </PatientRoute>
              } 
            />
            <Route 
              path="/patient/profile" 
              element={
                <PatientRoute>
                  <PatientProfile />
                </PatientRoute>
              } 
            />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;