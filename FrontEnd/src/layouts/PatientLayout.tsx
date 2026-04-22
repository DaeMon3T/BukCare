import React from "react";
import { Outlet } from "react-router-dom";
import BottomTabNav from "@/components/BottomTabNav";

/**
 * Layout wrapper for all patient pages.
 * Adds bottom tab navigation on mobile and bottom padding to prevent content overlap.
 */
const PatientLayout: React.FC = () => {
  return (
    <div className="pb-20 md:pb-0">
      <Outlet />
      <BottomTabNav />
    </div>
  );
};

export default PatientLayout;
