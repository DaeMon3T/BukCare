import { Link, Outlet, useLocation } from "react-router-dom";
import { Calendar, Bell, User, CalendarDays, LogOut } from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: CalendarDays, path: "/doctor/dashboard" },
  { label: "Appointments", icon: Calendar, path: "/doctor/appointments" },
  { label: "Schedules", icon: CalendarDays, path: "/doctor/set-availability" },
  { label: "Notifications", icon: Bell, path: "/doctor/notifications" },
  { label: "Profile", icon: User, path: "/doctor/profile" },
];

export default function DoctorLayout() {
  const location = useLocation();

  const handleLogout = () => {
    // TODO: add logout logic (clear token + navigate)
  };

  return (
    <div className="flex bg-gray-50 h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md fixed h-full">
        <div className="text-center py-6 font-bold text-lg border-b">
          BukCare Doctor
        </div>

        <ul className="mt-4 space-y-1 px-3">
          {sidebarItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 p-2 rounded-md transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute bottom-4 left-4 right-4 p-2 text-red-600 flex gap-2 items-center hover:bg-red-100 rounded-md"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Topbar + Content */}
      <main className="ml-64 flex-1">
        {/* Topbar */}
        <header className="bg-white shadow-sm p-4 flex justify-end">
          {/* Could later show doctor name + avatar from token */}
          <span className="font-medium text-gray-700">Doctor Panel</span>
        </header>

        {/* Routed pages */}
        <section className="p-6">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
