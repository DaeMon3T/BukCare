// ============================================================================
// 5. App.jsx - Updated with Role-Based Routing
// ============================================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, DoctorRoute, StaffRoute, PatientRoute } from './routes/ProtectedRoutes';

// Auth Pages
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import CompleteProfile from './pages/auth/CompleteProfile'; 

// Public Pages
import Landing from './pages/public/Landing';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Services from './pages/public/Services';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminProfile from './pages/admin/Profile';

// Doctor Pages
import DoctorSignUp from './pages/doctor/SignUp';   // ✅ add this
import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorProfile from './pages/doctor/Profile';

// Staff Pages
import StaffHome from './pages/staff/Home';
import StaffAppointments from './pages/staff/Appointments';
import StaffProfile from './pages/staff/Profile';

// Patient Pages
import PatientHome from './pages/patient/Home';
import PatientAppointments from './pages/patient/Appointments';
import PatientProfile from './pages/patient/Profile';


function App() {
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
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/profile" element={
              <AdminRoute>
                <AdminProfile />
              </AdminRoute>
            } />

            <Route path="/doctor/signup" element={<DoctorSignUp />} />
            {/* Doctor Routes */}
            <Route path="/doctor/dashboard" element={
              <DoctorRoute>
                <DoctorDashboard />
              </DoctorRoute>
            } />
            <Route path="/doctor/appointments" element={
              <DoctorRoute>
                <DoctorAppointments />
              </DoctorRoute>
            } />
            <Route path="/doctor/profile" element={
              <DoctorRoute>
                <DoctorProfile />
              </DoctorRoute>
            } />
            
            {/* Staff Routes */}
            <Route path="/staff/home" element={
              <StaffRoute>
                <StaffHome />
              </StaffRoute>
            } />
            <Route path="/staff/appointments" element={
              <StaffRoute>
                <StaffAppointments />
              </StaffRoute>
            } />
            <Route path="/staff/profile" element={
              <StaffRoute>
                <StaffProfile />
              </StaffRoute>
            } />
            
            {/* Patient Routes */}
            <Route path="/patient/home" element={
              <PatientRoute>
                <PatientHome />
              </PatientRoute>
            } />
            <Route path="/patient/appointments" element={
              <PatientRoute>
                <PatientAppointments />
              </PatientRoute>
            } />
            <Route path="/patient/profile" element={
              <PatientRoute>
                <PatientProfile />
              </PatientRoute>
            } />
            
            {/* Catch all route - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;