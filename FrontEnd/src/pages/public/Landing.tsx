import React, { useState } from "react";
import { Link } from "react-router-dom";

// ===================================================================
// === ASSETS & ICONS ===
// ===================================================================

const IconCheck: React.FC = () => (
  <svg className="w-6 h-6 text-[#FFC72C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

const IconStar: React.FC = () => (
  <svg className="w-5 h-5 text-[#FFC72C] fill-current" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const IconStethoscope: React.FC = () => (
  <svg className="w-10 h-10 text-[#00338D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 3.5c-3.038 0-5.5 2.462-5.5 5.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5v.5c0 .276.224.5.5.5h2c.276 0 .5-.224.5-.5v-.5c0-3.038-2.462-5.5-5.5-5.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10.5v5c0 1.657 1.343 3 3 3h2c1.657 0 3-1.343 3-3v-5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 14.5c0 2.485 2.015 4.5 4.5 4.5S15 16.985 15 14.5" />
  </svg>
);

const IconCalendar: React.FC = () => (
  <svg className="w-10 h-10 text-[#00338D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconShield: React.FC = () => (
  <svg className="w-10 h-10 text-[#00338D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BukCareLogo: React.FC = () => {
  return (
    
    <div className="logo-container" role="img" aria-label="BUKCARE logo">
      <div className="logo-text" aria-hidden="true">
        <span className="buk">BUK</span>
        <span className="heart-graphic" aria-hidden="true"></span>
        <span className="care">CARE</span>
      </div>
    </div>
  );
};

// ===================================================================
// === COMPONENT: FAQ ITEM (Objection Handling) ===
// ===================================================================
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-4 text-left focus:outline-none"
      >
        <span className="text-lg font-medium text-[#00338D]">{question}</span>
        <span className="text-[#00338D] text-2xl">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="pb-4 text-gray-600">{answer}</div>}
    </div>
  );
};

// ===================================================================
// === MAIN LANDING COMPONENT ===
// ===================================================================
const Landing: React.FC = () => {
  return (
    
    <>
      {/* --- VIDEO BACKGROUND --- */}
      <video
        src="/Bukcare-video-bg.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-[-2]"
      />
      {/* --- OVERLAY --- */}
      <div className="fixed top-0 left-0 w-full h-full bg-[#00338D]/40 z-[-1]" />

      {/* --- CONTENT WRAPPER --- */}
      <div className="relative z-0 min-h-screen font-sans">
        
        {/* 1. HEADER (NO NAVIGATION - REMOVES DISTRACTION) */}
        <header className="flex items-center justify-center">
          <div className="px-2 rounded-full mr-65">
             <BukCareLogo />
          </div>
        </header>

        {/* 2. HERO SECTION (THE HOOK - ABOVE THE FOLD) */}
        <section className=" pb-100 px-3 text-center">
          <div className="max-w-7xl mx-auto space-y-2">
            {/* Benefit-Driven Headline */}
            <h1 className="text-5xl md:text-4xl font-extrabold text-white drop-shadow-md leading-tight">
              CONNECTING PATIENTS AND DOCTORS IN BUKIDNON <br />
              {/* <span className="text-[#FFC72C]">See a Doctor Today.</span> */}
            </h1>
            
            {/* Sub-headline (Explanation) */}
            <p className="text-12 md:text-1xl text-white/90 max-w-4xl mx-auto font-medium">
              Say goodbye to long queues and missed appointments. Book your consultation online and receive instant automated reminders.
            </p>

            {/* Primary CTA */}
            <div className="pt-7">
              <Link
                to="/signup"
                className="inline-block bg-[#FFC72C] text-[#00338D] text-12 font-bold px-5 py-4 rounded-full shadow-[0_0_20px_rgba(255,199,44,0.5)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,199,44,0.7)] transition-all transform "
              >
                Book My Appointment Now
              </Link>
              {/* <p className="text-white/80 text-sm mt-3">
                No credit card required to sign up.
              </p> */}
            </div>
          </div>
        </section>

        {/* 3. SOCIAL PROOF (THE TRUST FACTOR) */}
        <div className="bg-white py-6 shadow-md">
          <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-20 items-center text-gray-500 font-bold text-sm uppercase tracking-widest">
            <span>Trusted By:</span>
            <div className="flex items-center gap-2"><IconCheck/> 120+ Doctors</div>
            <div className="flex items-center gap-2"><IconCheck/> 800+ Patients</div>
            <div className="flex items-center gap-2"><IconCheck/> 10+ Partner Hospitals</div>
          </div>
        </div>

        {/* 4. WHY US (THE BENEFITS - SOLVING PAIN POINTS) */}
        <section className="py-20 px-6 bg-[#f8f9fa]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#00338D] mb-4">
                Why choose BukCare?
              </h2>
              <p className="text-xl text-gray-600">
                Because your health shouldn't wait for office hours.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {/* Benefit 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#FFC72C] hover:-translate-y-2 transition duration-300">
                <div className="mb-6 bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <IconCalendar />
                </div>
                <h3 className="text-xl font-bold text-[#00338D] mb-3 text-center">Online Scheduling</h3>
                <p className="text-gray-600 text-center">
                  Book appointments with your preferred specialists anytime, anywhere, without visiting the clinic physically.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#00338D] hover:-translate-y-2 transition duration-300">
                <div className="mb-6 bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <IconStethoscope />
                </div>
                <h3 className="text-xl font-bold text-[#00338D] mb-3 text-center">Find Specialist</h3>
                <p className="text-gray-600 text-center">
                 Browse our directory of qualified doctors in Bukidnon and view their available schedules instantly.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-[#FFC72C] hover:-translate-y-2 transition duration-300">
                <div className="mb-6 bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <IconShield />
                </div>
                <h3 className="text-xl font-bold text-[#00338D] mb-3 text-center">Smart Notification</h3>
                <p className="text-gray-600 text-center">
                  Receive automated SMS and email reminders so you never miss a check-up or consultation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS (THE LOGIC - 3 STEPS) */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#00338D] text-center mb-16">
              Get seen in 3 simple steps
            </h2>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
              {/* Connecting Line (Desktop Only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 transform -translate-y-1/2"></div>

              {/* Step 1 */}
              <div className="bg-white p-6 w-full md:w-1/3 text-center">
                <div className="w-12 h-12 bg-[#00338D] text-white text-xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">1</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Create Account</h4>
                <p className="text-gray-600 text-sm">Sign up in 30 seconds. It’s completely free.</p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 w-full md:w-1/3 text-center">
                <div className="w-12 h-12 bg-[#FFC72C] text-[#00338D] text-xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">2</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Select Doctor</h4>
                <p className="text-gray-600 text-sm">Browse by specialty, location, or availability.</p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 w-full md:w-1/3 text-center">
                <div className="w-12 h-12 bg-[#00338D] text-white text-xl font-bold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">3</div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Get Treated</h4>
                <p className="text-gray-600 text-sm">Receive your appointment schedule.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. TESTIMONIALS (MORE PROOF) */}
        <section className="py-20 px-6 bg-[#00338D] text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-12">Don't just take our word for it</h2>
            <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 relative">
              <div className="flex justify-center gap-1 mb-6">
                <IconStar /><IconStar /><IconStar /><IconStar /><IconStar />
              </div>
              <p className="text-xl md:text-2xl italic mb-6">
                "I needed a pediatrician for my son urgently. BukCare helped me find a specialist in Valencia and book a slot for the same afternoon. No waiting in the clinic!"
              </p>
              <div className="font-bold text-[#FFC72C]">
                — Maria S., Valencia City
              </div>
            </div>
          </div>
        </section>

        {/* 7. OBJECTION HANDLING (FAQ) */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#00338D] text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <FAQItem 
                question="Is BukCare free to use?" 
                answer="Yes! Creating an account and searching for doctors is 100% free. You only pay the doctor's consultation fee at the clinic or via the app." 
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

        {/* 8. FINAL FOOTER (THE LAST PUSH + RISK REVERSAL) */}
        <footer className="bg-[#001a4d] text-white pt-16 pb-8 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to take control of your health?</h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of patients in Bukidnon who have stopped waiting.
            </p>
            
            {/* Secondary CTA */}
            <Link
              to="/signup"
              className="inline-block bg-[#FFC72C] text-[#00338D] font-bold px-12 py-4 rounded-full hover:bg-white transition-colors mb-12"
            >
              Get Started Free
            </Link>

            {/* Trust Badges / Guarantee */}
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm text-gray-400 border-t border-gray-700 pt-8">
              <div className="flex items-center gap-2">
                <IconCheck /> No Credit Card Needed
              </div>
              <div className="flex items-center gap-2">
                <IconCheck /> Instant Confirmation
              </div>
              <div className="flex items-center gap-2">
                <IconCheck /> 24/7 Support
              </div>
            </div>
            
            {/* Legal Links (Small) */}
            <div className="mt-10 text-xs text-gray-500">
              <p>&copy; 2025 BukCare. All rights reserved.</p>
              <div className="mt-2 space-x-4">
                <Link to="#" className="hover:text-white">Privacy Policy</Link>
                <Link to="#" className="hover:text-white">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
};

export default Landing;