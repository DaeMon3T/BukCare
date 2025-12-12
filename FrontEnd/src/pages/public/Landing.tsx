
import React, { useState } from "react";
import { Link } from "react-router-dom";

const IconMapPin: React.FC = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconClock: React.FC = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconPhone: React.FC = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const IconCheck: React.FC = () => (
  <svg className="w-6 h-6 text-[#00aeef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const IconStar: React.FC = () => (
  <svg className="w-5 h-5 text-[#FFC72C] fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

// Feature Icons (White for the cards)
const IconStethoscopeWhite: React.FC = () => (
  <svg className="w-10 h-10 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 3.5c-3.038 0-5.5 2.462-5.5 5.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-3.038-2.462-5.5-5.5-5.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5v5c0 1.657 1.343 3 3 3h2c1.657 0 3-1.343 3-3v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14.5c0 2.485 2.015 4.5 4.5 4.5S15 16.985 15 14.5" />
  </svg>
);

const IconEmergencyWhite: React.FC = () => (
  <svg className="w-10 h-10 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const IconTransplantWhite: React.FC = () => (
  <svg className="w-10 h-10 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const BukCareLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 bg-[#00aeef] rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 3" />
        </svg>
      </div>
    </div>
  );
};

// ===================================================================
// === COMPONENT: FAQ ITEM ===
// ===================================================================
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left focus:outline-none hover:bg-gray-50 transition px-2"
      >
        <span className="text-lg font-medium text-[#222]">{question}</span>
        <span className="text-[#00aeef] text-2xl">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="pb-4 px-2 text-gray-500">{answer}</div>}
    </div>
  );
};

// ===================================================================
// === MAIN LANDING COMPONENT ===
// ===================================================================
const Landing: React.FC = () => {
  
  // Helper function to scroll top
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans">
      
      {/* 2. NAVIGATION BAR (White) */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-8xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Group */}
          <div className="flex items-center gap-2 ml-78">
            <div className="text-2xl font-bold text-slate-800">
              <span className="text-[#0099cc]">Buk</span>Care
            </div>
          </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide pt-3 pb-3">
                <Link to="/" className="text-[#00aeef]" onClick={handleScrollTop}>Home</Link>
                <Link to="./About" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>About</Link>
                <Link to="./Services" className="hover:text-[#00aeef] transition">Services</Link>
                <Link to="./Contact" className="hover:text-[#00aeef] transition">Contact</Link>
                <Link to="./Terms" className="hover:text-[#00aeef] transition">Terms of Services & Privacy Policy</Link>
            </div>

            {/* Search / Social Icons (Simulated) */}
            <div className="hidden md:flex gap-4 text-gray-400">
                <button className="hover:text-[#00aeef]"><i className="fas fa-search"></i></button>
                <button className="hover:text-[#00aeef]"><i className="fas fa-shopping-bag"></i></button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
                <button className="text-gray-600 p-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
        </div>
      </nav>

      {/* 3. HERO SECTION (Blue Gradient + Logo) */}
      <div className="relative bg-gradient-to-r from-[#dcf0fa] to-[#eef6fb] pb-20 md:pb-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            
            {/* Text Content */}
            <div className="z-5 animate-fade-in-up">
                <span className="text-[#00aeef] font-bold text-lg tracking-wide mb-2 block">
                    Welcome to BukCare
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold text-[#222] leading-tight mb-6">
                    Connecting Patient and Doctors <br/>
                    In Bukidnon
                </h1>
                <p className="text-gray-500 text-lg mb-8 max-w-lg leading-relaxed">
                    Say goodbye to long queues. Connect with the best doctors in Bukidnon, book appointments online, and receive automated reminders.
                </p>
                
                <Link 
                    to="/signup"
                    onClick={handleScrollTop}
                    className="inline-block bg-[#00aeef] text-white font-bold text-sm px-8 py-4 rounded shadow-lg hover:bg-[#009bd5] hover:-translate-y-1 transition transform uppercase tracking-widest"
                >
                    Sign In/Sign Up
                </Link>
            </div>

            {/* RIGHT SIDE: BUKCARE LOGO REPLACEMENT */}
            <div className="relative z-10 hidden md:flex justify-center items-center h-full ml-40">
                <img 
                    src="./bukcare_logo.png" 
                    alt="BukCare Logo" 
                    className="w-full max-w-md h-auto object-contain drop-shadow-2xl"
                />
            </div>
        </div>
      </div>

      {/* 4. FEATURE CARDS (Overlapping Bottom) */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 md:-mt-32 relative z-20">
        <div className="grid md:grid-cols-3 shadow-2xl">
            
            {/* Card 1: Qualified Doctors (Blue) */}
            <div className="bg-[#00aeef] p-10 text-white text-center group hover:bg-[#009bd5] transition duration-300">
                <div className="flex justify-center"><IconStethoscopeWhite /></div>
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">Centralize Online Scheduling</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                    Replace manual booking methods with a digital system that allows patients to schedule their own appointments online.
                </p>
                {/* <Link to="#" className="text-xs font-bold border border-white/30 px-4 py-2 rounded uppercase hover:bg-white hover:text-[#00aeef] transition">
                    Read More
                </Link> */}
            </div>

            {/* Card 2: Emergency Services (Lighter Blue) */}
            <div className="bg-[#48c7f4] p-10 text-white text-center group hover:bg-[#3bb5e0] transition duration-300">
                <div className="flex justify-center"><IconEmergencyWhite /></div>
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">Real-Time Notifications</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                   Get instant alerts if a doctor’s schedule changes or if they become unavailable, preventing wasted trips to the hospital.
                </p>
                {/* <Link to="#" className="text-xs font-bold border border-white/30 px-4 py-2 rounded uppercase hover:bg-white hover:text-[#48c7f4] transition">
                    Read More
                </Link> */}
            </div>

             {/* Card 3: 24/7 Services (Cyan) */}
             <div className="bg-[#2dc7f8] p-10 text-white text-center group hover:bg-[#20b4e2] transition duration-300">
                <div className="flex justify-center"><IconTransplantWhite /></div>
                <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">Live Doctor Availability</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                   Patients can view a doctor's schedule and availability in real-time before booking.
                </p>
                {/* <Link to="#" className="text-xs font-bold border border-white/30 px-4 py-2 rounded uppercase hover:bg-white hover:text-[#2dc7f8] transition">
                    Read More
                </Link> */}
            </div>

        </div>
      </div>

      {/* 5. TRUST/SOCIAL PROOF */}
      <div className="py-16 bg-white text-center">
         <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6">Impact and Benefits</p>
         <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale">
            {/* Simple Text Placeholders for Logos */}
            <span className="text-2xl font-bold text-gray-300">FOR COMMUNITY</span>
            <span className="text-2xl font-bold text-gray-300">FOR HOSPITAL</span>
            <span className="text-2xl font-bold text-gray-300">FOR HEALTHCARE</span>
         </div>
      </div>

      {/* 6. HOW IT WORKS (Simplified) */}
      <section className="py-20 px-6 bg-[#f9f9f9]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
                <span className="text-[#00aeef] font-bold text-sm tracking-widest uppercase">Process</span>
                <h2 className="text-3xl font-extrabold text-[#222] mt-2">How it Works</h2>
                <div className="w-16 h-1 bg-[#00aeef] mx-auto mt-4"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                  { step: "01", title: "Create Account", desc: "Sign up in 30 seconds. It’s completely free." },
                  { step: "02", title: "Select Doctor", desc: "Browse by specialty, location, or availability." },
                  { step: "03", title: "Get Treated", desc: "Receive your appointment schedule instantly." }
              ].map((item, idx) => (
                  <div key={idx} className="bg-white p-8 rounded shadow-sm hover:shadow-md transition">
                      <div className="text-5xl font-black text-gray-100 mb-4">{item.step}</div>
                      <h4 className="text-xl font-bold text-[#222] mb-2">{item.title}</h4>
                      <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
              ))}
            </div>
          </div>
        </section>


      {/* 7. FAQ SECTION */}
      <section className="py-20 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-[#222]">Frequently Asked Questions</h2>
                <div className="w-16 h-1 bg-[#00aeef] mx-auto mt-4"></div>
            </div>
            <div className="space-y-2">
              <FAQItem 
                question="Is BukCare free to use?" 
                answer="Yes! Creating an account and searching for doctors is 100% free. You only pay the doctor's consultation fee at the clinic/hospital." 
              />
              <FAQItem 
                question="Are the doctors verified?" 
                answer="Absolutely. We strictly verify the medical licenses of every healthcare provider before they can list on our platform." 
              />
              <FAQItem 
                question="Can I cancel my appointment?" 
                answer="Yes, you can reschedule or cancel up to 2 hours before your appointment time directly through your dashboard." 
              />
            </div>
          </div>
        </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#222] text-white pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 border-b border-gray-800 pb-12">
            <div>
                
                <p className="text-gray-500 text-sm mt-4 leading-relaxed">
                    Connecting patients and doctors in Bukidnon. Better healthcare access for everyone.
                </p>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                    <li><Link to="./Landing" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Home</Link></li>
                    <li><Link to="./About" className="hover:text-[#00aeef]" onClick={handleScrollTop}>About Us</Link></li>
                    <li><Link to="./Services" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Services</Link></li>
                    <li><Link to="./Contact" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Contact</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-4">Services</h4>
                <ul className="space-y-2 text-gray-400 text-sm">
                    {/* These links use #, which usually doesn't need a hard scroll reset unless you have deep linking. Added just in case. */}
                    <li><Link to="#" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Cardiology</Link></li>
                    <li><Link to="#" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Pediatrics</Link></li>
                    <li><Link to="#" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Dental Care</Link></li>
                    <li><Link to="#" className="hover:text-[#00aeef]" onClick={handleScrollTop}>Neurology</Link></li>
                </ul>
            </div>
            <div>
                <h4 className="font-bold text-lg mb-4">Contact Us</h4>
                <div className="text-gray-400 text-sm space-y-3">
                    <div className="flex items-center"><IconMapPin /> Bukidnon, Philippines</div>
                    <div className="flex items-center"><IconPhone />bukcare.app@gmail.com</div>
                    <div className="flex items-center"><IconClock /> 24/7</div>
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs">
            <p>&copy; 2025 BukCare. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
                <Link to="./Terms" className="hover:text-white" onClick={handleScrollTop}>Privacy Policy</Link>
                <Link to="./Terms" className="hover:text-white" onClick={handleScrollTop}>Terms of Service</Link>
            </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;