// src/components/GradientButton.jsx
export default function GradientButton({ children, type = "button", onClick, className = "" }) {
    return (
      <button
        type={type}
        onClick={onClick}
        className={`w-full text-white py-2 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:opacity-90 transition ${className}`}
      >
        {children}
      </button>
    );
  }
  