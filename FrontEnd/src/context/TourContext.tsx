import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getTourForRole } from "@/config/onboardingTours";
import type { TourStep } from "@/config/onboardingTours";

interface TourContextType {
  isRunning: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: (markCompleted?: boolean) => void;
  next: () => void;
  prev: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};

// Keyed by email (stable across logins) rather than id, which can be
// regenerated each login when the auth response omits a user id.
const seenKey = (email: string | undefined, role: string) =>
  `bukcare_tour_seen:${email ?? "anon"}:${role}`;

// Routes where the tour is allowed to auto-start on first visit.
const isTourLandingPath = (pathname: string) =>
  pathname.endsWith("/dashboard") || pathname.endsWith("/home");

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const role = user?.role ?? "patient";
  const steps = useMemo(() => getTourForRole(role), [role]);

  // Guard so auto-start only fires once per mounted session.
  const autoStartedRef = useRef(false);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsRunning(true);
  }, []);

  const endTour = useCallback(
    (markCompleted = true) => {
      setIsRunning(false);
      setCurrentStep(0);
      if (markCompleted && user) {
        try {
          localStorage.setItem(seenKey(user.email, role), "1");
        } catch {
          /* ignore storage errors */
        }
      }
    },
    [user, role]
  );

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        endTour(true);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length, endTour]);

  const prev = useCallback(() => {
    setCurrentStep((p) => Math.max(0, p - 1));
  }, []);

  // Auto-start the tour the first time a user lands on their dashboard/home.
  useEffect(() => {
    if (!user || autoStartedRef.current) return;
    if (!isTourLandingPath(location.pathname)) return;

    let seen = false;
    try {
      seen = localStorage.getItem(seenKey(user.email, role)) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;

    autoStartedRef.current = true;
    const timer = window.setTimeout(() => {
      // Mark as seen as soon as it auto-starts so a returning user never
      // gets it again automatically — they replay via "Take a Tour".
      try {
        localStorage.setItem(seenKey(user.email, role), "1");
      } catch {
        /* ignore storage errors */
      }
      setCurrentStep(0);
      setIsRunning(true);
    }, 900); // let the dashboard finish its initial render
    return () => window.clearTimeout(timer);
  }, [user, role, location.pathname]);

  // Drive the router so cross-page steps land on the right route before showing.
  useEffect(() => {
    if (!isRunning) return;
    const step = steps[currentStep];
    if (step?.route && step.route !== location.pathname) {
      navigate(step.route);
    }
  }, [isRunning, currentStep, steps, navigate, location.pathname]);

  // Reset the auto-start guard when the user changes (e.g. logout/login).
  useEffect(() => {
    autoStartedRef.current = false;
    setIsRunning(false);
    setCurrentStep(0);
  }, [user?.email, role]);

  const value = useMemo(
    () => ({ isRunning, currentStep, steps, startTour, endTour, next, prev }),
    [isRunning, currentStep, steps, startTour, endTour, next, prev]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export default TourContext;
