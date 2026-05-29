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
    // ── Dashboard ──
    {
      target: '[data-tour="nav-dashboard"]',
      route: "/doctor/dashboard",
      title: "Your Dashboard",
      content:
        "This is your command center. Use the top navigation to move between Dashboard, Appointments, Availability, Staff Access, and Messages.",
      placement: "bottom",
    },
    {
      target: '[data-tour="doc-stats"]',
      route: "/doctor/dashboard",
      title: "At-a-Glance Stats",
      content:
        "Today's appointments, pending requests, confirmed visits, and your totals — all summarized up top.",
      placement: "bottom",
    },
    {
      target: '[data-tour="doc-charts"]',
      route: "/doctor/dashboard",
      title: "Visual Analytics",
      content:
        "Weekly trends and a status breakdown help you see how your week is shaping up at a glance.",
      placement: "top",
    },
    {
      target: '[data-tour="doc-appointments-list"]',
      route: "/doctor/dashboard",
      title: "Today's Appointments",
      content:
        "Switch between Today, Upcoming, and All, search by patient, and click any card to view full details and update its status.",
      placement: "top",
    },
    {
      target: '[data-tour="doc-calendar"]',
      route: "/doctor/dashboard",
      title: "Schedule Calendar",
      content:
        "Click any date to see that day's slots and bookings. Dots mark days with appointments or availability.",
      placement: "left",
    },
    {
      target: '[data-tour="doc-scan"]',
      route: "/doctor/dashboard",
      title: "Scan Patient ID",
      content:
        "Scan a patient's Medical ID QR code to instantly pull up their record before a consultation.",
      placement: "bottom",
    },
    // ── Appointments ──
    {
      target: '[data-tour="doc-appt-tabs"]',
      route: "/doctor/appointments",
      title: "Manage Appointments",
      content:
        "The Appointments tab lists every booking. Filter by status — pending, confirmed, completed, expired, or cancelled.",
      placement: "bottom",
    },
    {
      target: '[data-tour="doc-appt-search"]',
      route: "/doctor/appointments",
      title: "Search & Act",
      content:
        "Search by patient or reason, sort by date, and use the menu (⋮) on any row to confirm, complete, or cancel a visit.",
      placement: "bottom",
    },
    // ── Availability ──
    {
      target: '[data-tour="avail-generator"]',
      route: "/doctor/set-availability",
      title: "Set Your Availability",
      content:
        "Bulk-generate bookable time slots: pick a date range, the weekdays, daily hours, and slot length, then Generate.",
      placement: "right",
    },
    {
      target: '[data-tour="avail-list"]',
      route: "/doctor/set-availability",
      title: "Your Active Schedule",
      content:
        "Every generated slot shows here, grouped by day. Clear a whole day or remove individual slots anytime.",
      placement: "top",
    },
    // ── Staff Access ──
    {
      target: '[data-tour="staff-add"]',
      route: "/doctor/manage-staff",
      title: "Grant Staff Access",
      content:
        "Add staff and assign a preset — Observer, Receptionist, or Full Access — then fine-tune individual permissions like booking walk-ins or managing appointments.",
      placement: "bottom",
    },
    // ── Messages ──
    {
      target: '[data-tour="messages-list"]',
      route: "/doctor/messages",
      title: "Messages",
      content:
        "Chat with your patients and answer follow-up questions. Conversations live here.",
      placement: "bottom",
    },
    // ── Global ──
    notificationsStep,
    profileStep,
  ],

  staff: [
    welcome("staff member"),
    // ── Dashboard ──
    {
      target: '[data-tour="nav-dashboard"]',
      route: "/staff/dashboard",
      title: "Your Workspace",
      content:
        "This is your staff dashboard. Use the top navigation to reach Appointments, Walk-ins, Scan, and Messages.",
      placement: "bottom",
    },
    {
      target: '[data-tour="staff-scan"]',
      route: "/staff/dashboard",
      title: "Scan Patient ID",
      content:
        "Scan a patient's Medical ID QR code to instantly verify them and pull up their record.",
      placement: "bottom",
    },
    {
      target: '[data-tour="staff-doctors"]',
      route: "/staff/dashboard",
      title: "Assigned Doctors",
      content:
        "The doctors who've granted you access appear here, along with your permission level — Observer, Receptionist, or Full Access.",
      placement: "bottom",
    },
    {
      target: '[data-tour="staff-stats"]',
      route: "/staff/dashboard",
      title: "At-a-Glance Stats",
      content:
        "Today's, pending, confirmed, completed, and cancelled appointments across all your doctors.",
      placement: "bottom",
    },
    {
      target: '[data-tour="staff-appointments"]',
      route: "/staff/dashboard",
      title: "Appointments Feed",
      content:
        "Switch between Today, Upcoming, and All, search by patient or doctor, and click any row to view and act on it.",
      placement: "top",
    },
    {
      target: '[data-tour="staff-charts"]',
      route: "/staff/dashboard",
      title: "Visual Analytics",
      content:
        "Weekly trends and a status breakdown give you a quick read on the week's workload.",
      placement: "top",
    },
    {
      target: '[data-tour="staff-calendar"]',
      route: "/staff/dashboard",
      title: "Schedule Calendar",
      content:
        "Click any date to see that day's appointments. Dots mark days with bookings.",
      placement: "left",
    },
    // ── Appointments ──
    {
      target: '[data-tour="staff-appt-tabs"]',
      route: "/staff/appointments",
      title: "Manage Appointments",
      content:
        "The full Appointments page. Filter by status — pending, confirmed, completed, expired, or cancelled.",
      placement: "bottom",
    },
    {
      target: '[data-tour="staff-appt-search"]',
      route: "/staff/appointments",
      title: "Search & Act",
      content:
        "Search by patient, doctor, or reason and sort by date. For doctors who gave you manage access, you can confirm, complete, or cancel visits.",
      placement: "bottom",
    },
    // ── Walk-ins ──
    {
      target: '[data-tour="walkin-new"]',
      route: "/staff/walk-in",
      title: "New Walk-in",
      content:
        "Register a patient who walked in, or look up a returning patient, then assign an available doctor and book on the spot.",
      placement: "top",
    },
    {
      target: '[data-tour="walkin-queue"]',
      route: "/staff/walk-in",
      title: "Today's Walk-in Queue",
      content:
        "Every walk-in booked today shows here with its status. Refresh to update, or cancel one if plans change.",
      placement: "bottom",
    },
    // ── Messages ──
    {
      target: '[data-tour="messages-list"]',
      route: "/staff/messages",
      title: "Messages",
      content:
        "Communicate with patients on behalf of the practice. Conversations live here.",
      placement: "bottom",
    },
    // ── Global ──
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
