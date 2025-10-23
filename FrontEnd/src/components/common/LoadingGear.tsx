import React from "react";
import { Settings } from "lucide-react";

interface LoadingGearProps {
  text?: string;
  color?: string;
  size?: number;
  showOverlay?: boolean; // optional, default false
}

const LoadingGear: React.FC<LoadingGearProps> = ({
  text,
  color = "#FFC43D",
  size = 55,
  showOverlay = true,
}) => {
  return (
    <div
      className={`${
        showOverlay
          ? "absolute inset-0 flex items-center justify-center z-40"
          : "flex items-center justify-center"
      }`}
      style={{
        backgroundColor: showOverlay ? "transparent" : "none",
        backdropFilter: showOverlay ? "none" : "none",
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <Settings
          className="animate-spin"
          style={{ color, width: size, height: size }}
        />
        {text && (
          <p className="mt-2 text-sm font-medium" style={{ color }}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingGear;
