import { Outlet } from "react-router-dom";

export default function DoctorLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content Area */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
}