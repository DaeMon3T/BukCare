// src/pages/public/Services.tsx
import React from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Services: React.FC = () => {
<<<<<<< Updated upstream
=======
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic Data
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Real Data (With Fallback)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/doctors");
        if (Array.isArray(res.data) && res.data.length > 0) {
            const uniqueSpecs = Array.from(new Set(res.data.map((d: any) => d.specialization))) as string[];
            setSpecialties(uniqueSpecs);
        } else {
            // Fallback for visual testing
            setSpecialties(["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Dermatology", "Orthopedics", "Ophthalmology"]);
        }
      } catch (err) {
        console.error("Using fallback due to API error", err);
        setSpecialties(["General Medicine", "Pediatrics", "Cardiology", "Neurology", "Dermatology", "Orthopedics"]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Animations & Smooth Scroll
  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (!loading) {
        const ctx = gsap.context(() => {
            // Hero Elements
            const heroTl = gsap.timeline();
            heroTl.fromTo(".hero-item", 
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
            );

            gsap.fromTo(".hero-image", 
                { x: 30, opacity: 0 },
                { x: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.4 }
            );

            // Service Cards Stagger
            gsap.fromTo(".service-card", 
                { y: 50, opacity: 0 },
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.1, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".services-grid",
                        start: "top 80%",
                    }
                }
            );

            // Process Steps
            gsap.fromTo(".process-step", 
                { y: 40, opacity: 0 },
                {
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.2, 
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".process-section",
                        start: "top 75%",
                    }
                }
            );

            // Features Section
            gsap.fromTo(".feature-item", 
                { x: -20, opacity: 0 },
                {
                    x: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.1, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: ".features-list",
                        start: "top 80%",
                    }
                }
            );

        }, containerRef);
        return () => ctx.revert();
    }
    
    return () => lenis.destroy();
  }, [loading]);

  // Icon Mapper Helper
  const getIconForSpecialty = (spec: string) => {
    const s = spec.toLowerCase();
    if (s.includes("heart") || s.includes("cardio")) return <Heart className="w-8 h-8 text-rose-500"/>;
    if (s.includes("brain") || s.includes("neuro")) return <Brain className="w-8 h-8 text-purple-500"/>;
    if (s.includes("bone") || s.includes("ortho")) return <Bone className="w-8 h-8 text-slate-500"/>;
    if (s.includes("eye") || s.includes("opth")) return <Eye className="w-8 h-8 text-blue-500"/>;
    if (s.includes("baby") || s.includes("pedia")) return <Baby className="w-8 h-8 text-pink-500"/>;
    if (s.includes("general") || s.includes("med")) return <Thermometer className="w-8 h-8 text-green-500"/>;
    if (s.includes("derma") || s.includes("skin")) return <Activity className="w-8 h-8 text-amber-500"/>;
    return <Stethoscope className="w-8 h-8 text-[#00aeef]"/>;
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact", path: "/contact" },
    { name: "Terms of Service", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" },

  ];

>>>>>>> Stashed changes
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navigation */}
      <nav className="p-6">
        <Link to="/" className="text-[#FFC43D] hover:text-white font-semibold">
          ← Back to Home
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 text-center">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Our <span className="text-[#FFC43D]">Healthcare Services</span>
        </h1>
        <p className="max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed text-white/90">
          Comprehensive healthcare solutions designed to meet all your medical needs
        </p>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#0057B8]">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto text-center">
          {[
            {
              step: "1️⃣",
              title: "Create Account",
              desc: "Sign up with your email and complete your medical profile securely",
            },
            {
              step: "2️⃣",
              title: "Find Your Doctor",
              desc: "Search by specialty, location, availability, and patient reviews",
            },
            {
              step: "3️⃣",
              title: "Book Instantly",
              desc: "Choose your preferred time slot and get instant confirmation",
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white/30 p-8 rounded-2xl shadow-lg hover:scale-105 transform transition duration-300 text-[#1A1A40]"
            >
              <div className="text-3xl mb-4">{item.step}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Medical Specialties Section */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
          Medical Specialties Available
        </h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { emoji: "🩺", title: "General Practice", desc: "Primary healthcare and routine checkups" },
            { emoji: "❤️", title: "Cardiology", desc: "Heart and cardiovascular system care" },
            { emoji: "🧠", title: "Neurology", desc: "Brain and nervous system disorders" },
            { emoji: "🦴", title: "Orthopedics", desc: "Bone, joint, and muscle treatment" },
            { emoji: "👁️", title: "Ophthalmology", desc: "Eye care and vision treatment" },
            { emoji: "🩸", title: "Dermatology", desc: "Skin, hair, and nail conditions" },
            { emoji: "🤱", title: "Pediatrics", desc: "Specialized care for children" },
            { emoji: "🏥", title: "Emergency Care", desc: "Urgent medical attention" },
          ].map((spec, index) => (
            <div
              key={index}
              className="bg-white/30 p-6 rounded-2xl shadow-lg text-center hover:scale-105 transform transition duration-300 text-[#1A1A40]"
            >
              <div className="text-3xl mb-3">{spec.emoji}</div>
              <h3 className="font-semibold mb-2 text-[#0057B8]">{spec.title}</h3>
              <p className="text-sm">{spec.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/20 rounded-2xl">
        <h2 className="text-4xl font-bold text-center mb-12 drop-shadow-lg text-[#FFC43D]">
          Platform Features
        </h2>
        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-[#0057B8]">For Patients</h3>
            {[
              { title: "Online Booking", desc: "Schedule appointments 24/7 from any device" },
              { title: "Appointment Reminders", desc: "Never miss an appointment with automated notifications" },
              { title: "Doctor Reviews", desc: "Read patient feedback to choose the right doctor" },
            ].map((feature, index) => (
              <div key={index} className="bg-white/30 p-4 rounded-xl mb-4 text-[#1A1A40]">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6 text-[#0057B8]">For Healthcare Providers</h3>
            {[
              { title: "Schedule Management", desc: "Efficiently manage your appointment calendar" },
              { title: "Patient Database", desc: "Secure access to patient information and history" },
              { title: "Secure Communication", desc: "HIPAA-compliant messaging with patients" },
            ].map((feature, index) => (
              <div key={index} className="bg-white/30 p-4 rounded-xl mb-4 text-[#1A1A40]">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-6 drop-shadow-lg text-[#FFC43D]">
          Ready to Experience Better Healthcare?
        </h2>
        <p className="mb-8 max-w-2xl mx-auto text-lg text-white/90">
          Join thousands of patients who have simplified their healthcare journey with BukCare.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            to="/signup"
            className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-[#FFD84C] hover:scale-105 transform transition duration-300"
          >
            Start Booking
          </Link>
          <Link
            to="/contact"
            className="bg-white text-[#0057B8] font-semibold px-10 py-3 rounded-3xl shadow-lg hover:bg-gray-100 hover:scale-105 transform transition duration-300"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
