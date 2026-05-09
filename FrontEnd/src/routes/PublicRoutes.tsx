// ============================================================================
// PublicRoutes.tsx - Public marketing pages and auth routes
// ============================================================================
import { Route } from 'react-router-dom';

// Auth Components
import GoogleCallbackHandler from '../components/auth/GoogleCallbackHandler';

// Auth Pages
import SignIn from '../pages/auth/SignIn';
import SignUp from '../pages/auth/SignUp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import CompleteProfile from '../pages/auth/CompleteProfile/CompleteProfile';
import OAuthSuccess from '../pages/auth/OAuthSuccess';

// Public Pages
import Landing from '../pages/public/Landing';
import About from '../pages/public/About';
import Contact from '../pages/public/Contact';
import Services from '../pages/public/Services';
import Terms from '../pages/public/Terms';
import Privacy from '../pages/public/Privacy';

const PublicRoutes = () => (
  <>
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
  </>
);

export default PublicRoutes;
