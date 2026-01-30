import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Mail, Globe } from "lucide-react";
import logo from "@/assets/images/icon_logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f172a] text-white pt-20 pb-10 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 border-b border-slate-800 pb-16">
        
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-1">
            <div className="text-2xl font-bold text-white tracking-tight mb-6 flex items-center gap-2">
                <img src={logo} alt="BukCare Logo" className="w-20 h-20 object-contain" />
                <span>Buk<span className="text-[#00aeef]">Care</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
                Connecting patients and doctors in Bukidnon. Better healthcare access for everyone, everywhere.
            </p>
        </div>
        
        {/* Platform Links */}
        <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Platform</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
                <li><Link to="/" className="hover:text-[#00aeef] transition-colors">Home</Link></li>
                <li><Link to="/about" className="hover:text-[#00aeef] transition-colors">About Us</Link></li>
                <li><Link to="/services" className="hover:text-[#00aeef] transition-colors">Services</Link></li>
                <li><Link to="/contact" className="hover:text-[#00aeef] transition-colors">Contact</Link></li>
            </ul>
        </div>

        {/* Legal Links (CRITICAL FOR GOOGLE VERIFICATION) */}
        <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Legal</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
                {/* These links MUST exist for verification */}
                <li><Link to="/privacy" className="hover:text-[#00aeef] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-[#00aeef] transition-colors">Terms of Service</Link></li>
            </ul>
        </div>

        {/* Contact Info */}
        <div>
            <h4 className="font-bold text-xs uppercase tracking-widest mb-6 text-slate-500">Contact</h4>
            <div className="text-slate-400 text-sm space-y-4">
                <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#00aeef]" /> 
                    <span>Maramag, Bukidnon</span>
                </div>
                <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-[#00aeef]" /> 
                    <a href="mailto:bukcare.app@gmail.com" className="hover:text-white transition-colors">bukcare.app@gmail.com</a>
                </div>
                <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-[#00aeef]" /> 
                    <a href="https://www.bukcare.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">www.bukcare.com</a>
                </div>
            </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs">
          <p>&copy; {new Date().getFullYear()} BukCare. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
              <span>Designed for Bukidnon</span>
          </div>
      </div>
    </footer>
  );
};

export default Footer;