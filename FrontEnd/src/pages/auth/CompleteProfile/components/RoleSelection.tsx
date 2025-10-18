// ============================================
// components/RoleSelection.tsx
// ============================================
import React from "react";

interface RoleSelectionProps {
  onSelectRole: (role: "doctor" | "patient") => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="bg-white/20 backdrop-blur-2xl p-10 rounded-2xl shadow-2xl border border-white/20 transition-all duration-300">
      <h2 className="text-3xl font-bold mb-10 text-center text-white">
        Choose Your <span className="text-[#FFC43D]">Role</span>
      </h2>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => onSelectRole("patient")}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          I am a Patient
        </button>
        <button
          onClick={() => onSelectRole("doctor")}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
        >
          I am a Doctor
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
export { RoleSelection };