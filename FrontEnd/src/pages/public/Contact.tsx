import React from "react";
import Footer from "@/components/Footer";

const Contact: React.FC = () => {
<<<<<<< Updated upstream
=======
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
        alert("Thank you! Your message has been sent.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setIsSubmitting(false);
    }, 1500);
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Animations
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

    const ctx = gsap.context(() => {
        // Hero Reveal
        const heroTl = gsap.timeline();
        heroTl.fromTo(".hero-item",
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out", delay: 0.2 }
        );

        // Contact Cards Stagger
        gsap.fromTo(".contact-card",
            { y: 50, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".contact-grid",
                    start: "top 85%",
                }
            }
        );

        // Form & Map Slide-in
        gsap.fromTo(".form-section",
            { x: -30, opacity: 0 },
            {
                x: 0, opacity: 1, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: ".main-content", start: "top 75%" }
            }
        );

        gsap.fromTo(".map-section",
            { x: 30, opacity: 0 },
            {
                x: 0, opacity: 1, duration: 1, ease: "power3.out",
                scrollTrigger: { trigger: ".main-content", start: "top 75%" }
            }
        );

    }, containerRef);

    return () => {
        ctx.revert();
        lenis.destroy();
    };
  }, []);

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
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 drop-shadow-lg">
          Get in <span className="text-[#FFC43D]">Touch</span>
        </h1>
        <p className="text-lg sm:text-xl max-w-2xl mx-auto text-white/90">
          We’d love to hear from you. Reach out with any questions or concerns.
        </p>
      </section>

      {/* Contact Info + Form */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Info */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-[#FFC43D]">Contact Information</h2>
          <p className="text-white/90 text-lg">📍 BukCare.com</p>
          <p className="text-white/90 text-lg">📞 +63 985 147 0234</p>
          <p className="text-white/90 text-lg">📧 bukcare.app@gmail.com</p>
        </div>

        {/* Form */}
        <div className="bg-white/20 backdrop-blur-md p-10 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#FFC43D]">Send us a message</h2>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent successfully!");
            }}
          >
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-4 border border-white/40 rounded-2xl bg-white/10 placeholder-white/70 focus:ring-2 focus:ring-[#FFC43D] focus:outline-none transition"
              required
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-4 border border-white/40 rounded-2xl bg-white/10 placeholder-white/70 focus:ring-2 focus:ring-[#FFC43D] focus:outline-none transition"
              required
            />
            <textarea
              placeholder="Your Message"
              className="w-full p-4 border border-white/40 rounded-2xl h-36 resize-none bg-white/10 placeholder-white/70 focus:ring-2 focus:ring-[#FFC43D] focus:outline-none transition"
              required
            ></textarea>
            <button
              type="submit"
              className="bg-[#FFC43D] text-[#1A1A40] font-semibold px-8 py-3 rounded-3xl shadow-lg hover:bg-[#FFD84C] hover:scale-105 transform transition duration-300"
            >
              Submit
            </button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <h2 className="text-4xl font-bold mb-10 text-center drop-shadow-lg text-[#FFC43D]">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            "💡 How do I book an appointment?",
            "💡 Can staff create accounts?",
            "💡 How secure is my data?",
          ].map((faq, idx) => (
            <div
              key={idx}
              className="bg-white/20 backdrop-blur-md text-white/90 p-6 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-105 transform transition cursor-pointer"
            >
              {faq}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
