// ============================================================================
// App.tsx - Top-level providers and route group composition
// ============================================================================
import type { FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Providers
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { CallProvider } from './context/CallContext';
import ErrorBoundary from './components/ErrorBoundary';

// Route Groups (organized by role)
import PublicRoutes from './routes/PublicRoutes';
import AdminRoutes from './routes/AdminRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import StaffRoutes from './routes/StaffRoutes';
import PatientRoutes from './routes/PatientRoutes';

// --------------------
// App Component
// --------------------
const App: FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/*
          WebSocketProvider lives inside Router so it can use navigation hooks if needed.
        */}
        <Router>
          <WebSocketProvider>
            <CallProvider>
              <Toaster position="top-center" reverseOrder={false} />

              <div className="App">
                <Routes>
                  {PublicRoutes()}
                  {AdminRoutes()}
                  {DoctorRoutes()}
                  {StaffRoutes()}
                  {PatientRoutes()}

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
