import { type ReactNode, useRef, useLayoutEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Scale, Menu, X } from "lucide-react";
import gsap from "gsap";
import Lenis from "@studio-freight/lenis";
import Footer from "@/components/Footer";
import logo from "@/assets/images/icon_logo_name.png";

interface Props {
  title: string;
  children: ReactNode;
}

const LegalLayout = ({ title, children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Terms", path: "/terms" },
    { name: "Privacy", path: "/privacy" },
  ];

  useLayoutEffect(() => {
    const lenis = new Lenis({ smoothWheel: true });
    const raf = (t: number) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    gsap.fromTo(
      ".hero-reveal",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1 }
    );

    return () => lenis.destroy();
  }, []);

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600">
      {/* NAVBAR */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="BukCare Logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                  location.pathname === link.path
                    ? "text-[#00aeef]"
                    : "text-slate-500 hover:text-[#00aeef]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-lg font-medium ${
                  location.pathname === link.path
                    ? "text-[#00aeef]"
                    : "text-slate-700 hover:text-[#00aeef]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 bg-slate-50 text-center px-6">
        <div className="hero-reveal inline-flex items-center gap-2 px-3 py-1 bg-slate-200 rounded-full text-xs font-bold uppercase mb-6">
          <Scale className="w-3 h-3" /> Legal & Compliance
        </div>

        <h1 className="hero-reveal text-4xl lg:text-6xl font-extrabold text-slate-900 mb-10">
          {title}
        </h1>

        {/* SINGLE BLUE TAB */}
        <div className="hero-reveal inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-8 py-3 rounded-lg text-sm font-bold bg-[#00aeef] text-white">
            {title}
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-6 py-20">{children}</main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default LegalLayout;
