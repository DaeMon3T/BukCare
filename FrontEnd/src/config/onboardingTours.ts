// ============================================================================
// onboardingTours.ts - Per-role guided tour step definitions
// ============================================================================
// Each step optionally anchors to a DOM element via `target` (a CSS selector,
// usually a [data-tour="..."] attribute). Steps without a target render as a
// centered card. If a target exists in the config but isn't currently visible
// (e.g. hidden behind a mobile breakpoint), TourOverlay falls back to centering.

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  /** CSS selector for the element to spotlight. Omit for a centered step. */
  target?: string;
  /** Route to navigate to before showing this step (for cross-page tours). */
  route?: string;
  title: string;
  content: string;
  placement?: TourPlacement;
}

const welcome = (role: string): TourStep => ({
  title: "Welcome to BukCare!",
  content:
    `Let's take a quick tour of the main features available to you as a ${role}. ` +
    "You can skip anytime, and replay this tour later from your profile menu.",
  placement: "center",
});

const notificationsStep: TourStep = {
  target: '[data-tour="notifications"]',
  title: "Notifications",
  content:
    "Appointment updates, reminders, and messages show up here. A red dot means you have something new.",
  placement: "bottom",
};

const profileStep: TourStep = {
  target: '[data-tour="profile-menu"]',
  title: "Your Profile & Tour",
  content:
    "Open this menu to edit your profile or sign out. You can also replay this tour anytime from here using “Take a Tour”.",
  placement: "bottom",
};

export const onboardingTours: Record<string, TourStep[]> = {
  patient: [
    welcome("patient"),
    // ── Home dashboard ──
    {
      target: '[data-tour="nav-home"]',
      route: "/patient/home",
      title: "Your Home Dashboard",
      content:
        "This is your home base. Let's walk through everything you can do here.",
      placement: "bottom",
    },
    {
      target: '[data-tour="patient-search"]',
      route: "/patient/home",
      title: "Quick Doctor Search",
      content:
        "Search for any doctor or specialist right from your home screen and jump straight to their profile.",
      placement: "bottom",
    },
    {
      target: '[data-tour="patient-schedule"]',
      route: "/patient/home",
      title: "Upcoming Schedule",
      content:
        "Your next confirmed or pending visit shows here at a glance. Tap it to see all your appointments.",
      placement: "bottom",
    },
    {
      target: '[data-tour="patient-categories"]',
      route: "/patient/home",
      title: "Browse by Specialty",
      content:
        "Looking for a specific kind of care? Tap a specialty to see matching doctors instantly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nearby-hospitals"]',
      route: "/patient/home",
      title: "Nearby Hospitals",
      content:
        "We surface hospitals close to your location here. Open the full locator to view them on a map and get directions.",
      placement: "top",
    },
    {
      target: '[data-tour="patient-health-tip"]',
      route: "/patient/home",
      title: "Daily Health Tip",
      content:
        "A fresh wellness tip each day to help you stay on top of your health.",
      placement: "top",
    },
    {
      target: '[data-tour="patient-recommended"]',
      route: "/patient/home",
      title: "Recommended Doctors",
      content:
        "Top-rated doctors we recommend for you. Tap “Make Appointment” to book directly.",
      placement: "top",
    },
    {
      target: '[data-tour="medical-id"]',
      route: "/patient/home",
      title: "Your Medical ID",
      content:
        "Open your Medical ID QR code here. Front-desk staff can scan it to pull up your record instantly — handy for walk-ins.",
      placement: "bottom",
    },
    // ── Find Doctors ──
    {
      target: '[data-tour="find-search"]',
      route: "/patient/find-doctor",
      title: "Find Doctors",
      content:
        "Search the entire network of doctors by name or keyword to find the right care.",
      placement: "bottom",
    },
    {
      target: '[data-tour="find-filters"]',
      route: "/patient/find-doctor",
      title: "Filter by Specialization",
      content:
        "Narrow results to a specific specialty. Tap any doctor's card to view their profile, reviews, and availability, then book.",
      placement: "bottom",
    },
    // ── Appointments ──
    {
      target: '[data-tour="appt-tabs"]',
      route: "/patient/appointments",
      title: "Your Appointments",
      content:
        "Track every visit here, filtered by status — pending, confirmed, completed, expired, or cancelled.",
      placement: "bottom",
    },
    {
      target: '[data-tour="appt-search"]',
      route: "/patient/appointments",
      title: "Manage Each Visit",
      content:
        "Search your visits, and use the menu (⋮) on any appointment to cancel it, or rate your doctor after a completed visit.",
      placement: "bottom",
    },
    // ── Messages ──
    {
      target: '[data-tour="messages-list"]',
      route: "/patient/messages",
      title: "Messages",
      content:
        "Chat directly with your doctors before or after a visit. Your conversations live here.",
      placement: "bottom",
    },
    // ── Global ──
    notificationsStep,
    profileStep,
  ],

  doctor: [
    welcome("doctor"),
    {
      target: '[data-tour="nav-dashboard"]',
      title: "Your Dashboard",
      content:
        "An overview of your day: appointment stats, trends, and quick actions.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-appointments"]',
      title: "Appointments",
      content:
        "Review, confirm, complete, or reschedule patient appointments. Add consultation notes here too.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-availability"]',
      title: "Set Availability",
      content:
        "Define the days and time slots patients can book. Keep this updated so your schedule stays accurate.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-manage-staff"]',
      title: "Staff Access",
      content:
        "Grant staff members granular permissions — like booking walk-ins or managing your appointments on your behalf.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-messages"]',
      title: "Messages",
      content: "Chat with your patients and answer follow-up questions.",
      placement: "bottom",
    },
    notificationsStep,
    profileStep,
  ],

  staff: [
    welcome("staff member"),
    {
      target: '[data-tour="nav-dashboard"]',
      title: "Your Dashboard",
      content: "A quick overview of today's activity and the tasks you can help with.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-appointments"]',
      title: "Appointments",
      content:
        "View and manage the appointments you've been granted access to by your doctor.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-walk-in"]',
      title: "Walk-ins",
      content:
        "Register walk-in patients and quickly book them an appointment on the spot.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-scan"]',
      title: "Scan Patient",
      content:
        "Scan a patient's Medical ID QR code to pull up their record instantly.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-messages"]',
      title: "Messages",
      content: "Communicate with patients on behalf of the practice.",
      placement: "bottom",
    },
    notificationsStep,
    profileStep,
  ],

  admin: [
    welcome("admin"),
    {
      target: '[data-tour="nav-dashboard"]',
      title: "Admin Dashboard",
      content:
        "System-wide analytics: users, appointments, and overall platform activity.",
      placement: "bottom",
    },
    {
      target: '[data-tour="nav-users"]',
      title: "User Management",
      content:
        "Approve or reject pending doctor sign-ups, manage roles, and review user details. The badge shows pending approvals.",
      placement: "bottom",
    },
    notificationsStep,
    profileStep,
  ],
};

const patientTour: TourStep[] = onboardingTours.patient ?? [];

export const getTourForRole = (role?: string): TourStep[] =>
  (role ? onboardingTours[role] : undefined) ?? patientTour;
