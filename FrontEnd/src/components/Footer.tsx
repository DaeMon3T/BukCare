import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#222] text-white pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 border-b border-gray-800 pb-12 ml-205">
        
        {/* Copyright */}
        <div className="text-sm text-white/50 text-center">
          © {currentYear} BukCare. All rights reserved.
        </div>

        {/* Links */}
        {/* <div className="flex gap-6 text-sm">
          <Link to="./Terms" className="hover:text-[#FFC43D] transition">
            Terms of Service
          </Link>
          <Link to="./Terms" className="hover:text-[#FFC43D] transition">
            Privacy Policy
          </Link>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
