import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A40] text-white/70 py-8">
      <div className="container mx-auto px-4 flex flex-col items-center space-y-4">
        
        {/* Copyright */}
        <div className="text-sm text-white/50 text-center">
          © {currentYear} BukCare. All rights reserved.
        </div>

        {/* Links */}
        <div className="flex gap-6 text-sm">
          <Link to="/terms" className="hover:text-[#FFC43D] transition">
            Terms of Service
          </Link>
          <Link to="/privacy" className="hover:text-[#FFC43D] transition">
            Privacy Policy
          </Link>
          <Link to="/contact" className="hover:text-[#FFC43D] transition">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
