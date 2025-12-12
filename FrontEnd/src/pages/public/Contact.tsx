// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import Footer from "@/components/Footer";

// const Contact: React.FC = () => {
//   // Ensure page starts at the top
//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   // Simple state for form handling demo
//   const [formData, setFormData] = useState({ name: "", email: "", message: "" });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     alert("Thank you! Your message has been sent.");
//     setFormData({ name: "", email: "", message: "" });
//   };

//   return (
//     <div className="min-h-screen bg-white text-slate-600 font-sans">
      
//       {/* Navigation Bar */}
//       <nav className="bg-white shadow-sm sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <div className="text-2xl font-bold text-slate-800">
//               <span className="text-[#0099cc]">Buk</span>Care
//             </div>
//           </div>
//           <Link 
//             to="/" 
//             className="text-slate-600 hover:text-[#0099cc] font-semibold transition-colors flex items-center gap-2 mr-5"
//           >
//             ← Back to Home
//           </Link>
//         </div>
//       </nav>

//       {/* Hero Section (Matches the large image with text overlay) */}
//       <section className="relative h-[600px] w-full overflow-hidden">
//         {/* Background Image - Using a medical placeholder to match the reference */}
//         <div 
//           className="absolute inset-0 bg-cover bg-center bg-no-repeat"
//           style={{
//             backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
//           }}
//         >
//           {/* Light Overlay to ensure text readability */}
//           <div className="absolute inset-0 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-transparent"></div>
//         </div>

//         {/* Hero Content */}
//         {/* Added h-full and flex items-center to center content vertically in the new 600px section */}
//         <div className="relative z-10 max-w-7xl mx-auto px-6 w-full h-full flex items-center">
//           <div className="max-w-xl">
//             <span className="text-[#0099cc] font-bold tracking-wide uppercase text-sm mb-2 block">
//               Contact Us
//             </span>
//             <h1 className="text-5xl font-bold text-slate-800 mb-6 leading-tight">
//               Get in <br />
//               <span className="text-slate-600">Touch Today</span>
//             </h1>
//             <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
//               Have questions about our services or need help booking an appointment? We are here to assist you 24/7.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* Main Content Area: Form & FAQ */}
//       <section className="py-24 px-6 bg-white">
//         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 ml-80">
          
//           {/* Left Column: Contact Form */}
//           <div>
//             <div className="mb-8">
//               <h2 className="text-3xl font-bold text-slate-800 mb-2">Send us a Message</h2>
//               <div className="h-1 w-16 bg-[#0099cc]"></div>
//             </div>
            
//             <form onSubmit={handleSubmit} className="space-y-6">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
//                 <input 
//                   type="text" 
//                   required
//                   placeholder="John Doe"
//                   value={formData.name}
//                   onChange={(e) => setFormData({...formData, name: e.target.value})}
//                   className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
//                 <input 
//                   type="email" 
//                   required
//                   placeholder="email@example.com"
//                   value={formData.email}
//                   onChange={(e) => setFormData({...formData, email: e.target.value})}
//                   className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
//                 <textarea 
//                   required
//                   rows={4}
//                   placeholder="How can we help you?"
//                   value={formData.message}
//                   onChange={(e) => setFormData({...formData, message: e.target.value})}
//                   className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition resize-none"
//                 ></textarea>
//               </div>

//               <div className="pt-2">
//                  <button type="submit" className="bg-[#0099cc] text-white font-bold px-10 py-4 rounded-sm shadow hover:bg-[#0088b5] transform hover:-translate-y-1 transition duration-300 uppercase text-sm tracking-wide">
//                    Submit Message
//                  </button>
//               </div>
//             </form>
//           </div>

//           {/* Right Column: FAQ */}
//           <div>
//             <div className="mb-8">
//               <h2 className="text-3xl font-bold text-slate-800 mb-2">Frequently Asked Questions</h2>
//               <div className="h-1 w-16 bg-[#0099cc]"></div>
//             </div>
            
//             <div className="space-y-4">
//               {[
//                 { q: "How do I cancel an appointment?", a: "You can cancel via your dashboard up to 2 hours before the scheduled time." },
//                 { q: "Do you accept insurance?", a: "Yes, we accept most major health insurance plans. Please check our Partners page." },
//                 { q: "Is my data secure?", a: "Absolutely. We use end-to-end encryption to protect your personal health information." },
//                 { q: "What are your support hours?", a: "Our digital support team is available 24/7, while phone support is available 8 AM - 8 PM." }
//               ].map((item, idx) => (
//                 <div
//                   key={idx}
//                   className="group bg-white border border-gray-100 p-6 rounded hover:shadow-md hover:border-[#0099cc]/30 transition cursor-pointer"
//                 >
//                   <div className="flex justify-between items-start mb-2 gap-4">
//                     <span className="text-slate-800 font-bold group-hover:text-[#0099cc] transition-colors">
//                       {item.q}
//                     </span>
//                     <span className="text-[#0099cc] font-bold opacity-50 group-hover:opacity-100 transition-opacity">+</span>
//                   </div>
//                   <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Contact Details Boxes */}
//       <section className="relative z-10">
//         <div className="grid md:grid-cols-3 text-white">
          
//           {/* Box 1: Location (Cyan) */}
//           <div className="bg-[#0099cc] p-12 text-center hover:bg-[#008fb3] transition duration-300">
//             <div className="mb-4 text-4xl">📍</div>
//             <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Visit Us</h3>
//             <p className="text-white/90">
//               BPH Maramag<br/>
//               Maramag, Bukidnon
//             </p>
//           </div>

//           {/* Box 2: Phone (Lighter Blue) */}
//           <div className="bg-[#4db8ff] p-12 text-center hover:bg-[#42aaff] transition duration-300">
//              <div className="mb-4 text-4xl">📞</div>
//             <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Call Us</h3>
//             <p className="text-white/90">
//               Main: +1 (555) 123-4567<br/>
//               Emergency: 911
//             </p>
//           </div>

//           {/* Box 3: Email (Darker Blue) */}
//           <div className="bg-[#0088b5] p-12 text-center hover:bg-[#007aa3] transition duration-300">
//             <div className="mb-4 text-4xl">📧</div>
//             <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Email Us</h3>
//             <p className="text-white/90">
//               bukcare.app@gmail.com<br/>
//             </p>
//           </div>

//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// };

// export default Contact;


// src/pages/public/Contact.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Contact: React.FC = () => {
  // Ensure page starts at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Added this function to handle the onClick event in your new links
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Simple state for form handling demo
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you! Your message has been sent.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans">
      
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Group */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-slate-800">
              <span className="text-[#0099cc]">Buk</span>Care
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="hidden md:flex items-center gap-20 text-sm font-bold text-gray-600 uppercase tracking-wide ml-60 pt-3 pb-3">
              <Link to="/" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>Home</Link>
              <Link to="/About" className="hover:text-[#00aeef] transition" onClick={handleScrollTop}>About</Link>
              <Link to="/Services" className="hover:text-[#00aeef] transition">Services</Link>
              {/* Highlighted Contact since we are on the Contact page */}
              <Link to="/Contact" className="text-[#00aeef]" onClick={handleScrollTop}>Contact</Link>
              <Link to="/Terms" className="hover:text-[#00aeef] transition">Terms of Services & Privacy Policy</Link>
          </div>
          
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] w-full overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
          }}
        >
          {/* Light Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full h-full flex items-center">
          <div className="max-w-xl">
            <span className="text-[#0099cc] font-bold tracking-wide uppercase text-sm mb-2 block">
              Contact Us
            </span>
            <h1 className="text-5xl font-bold text-slate-800 mb-6 leading-tight">
              Get in <br />
              <span className="text-slate-600">Touch Today</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
              Have questions about our services or need help booking an appointment? We are here to assist you 24/7.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area: Form & FAQ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 ml-80">
          
          {/* Left Column: Contact Form */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Send us a Message</h2>
              <div className="h-1 w-16 bg-[#0099cc]"></div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full p-4 border border-gray-200 rounded bg-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-[#0099cc] focus:border-[#0099cc] focus:outline-none transition resize-none"
                ></textarea>
              </div>

              <div className="pt-2">
                  <button type="submit" className="bg-[#0099cc] text-white font-bold px-10 py-4 rounded-sm shadow hover:bg-[#0088b5] transform hover:-translate-y-1 transition duration-300 uppercase text-sm tracking-wide">
                    Submit Message
                  </button>
              </div>
            </form>
          </div>

          {/* Right Column: FAQ */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Frequently Asked Questions</h2>
              <div className="h-1 w-16 bg-[#0099cc]"></div>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "How do I cancel an appointment?", a: "You can cancel via your dashboard up to 2 hours before the scheduled time." },
                { q: "Do you accept insurance?", a: "Yes, we accept most major health insurance plans. Please check our Partners page." },
                { q: "Is my data secure?", a: "Absolutely. We use end-to-end encryption to protect your personal health information." },
                { q: "What are your support hours?", a: "Our digital support team is available 24/7, while phone support is available 8 AM - 8 PM." }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="group bg-white border border-gray-100 p-6 rounded hover:shadow-md hover:border-[#0099cc]/30 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <span className="text-slate-800 font-bold group-hover:text-[#0099cc] transition-colors">
                      {item.q}
                    </span>
                    <span className="text-[#0099cc] font-bold opacity-50 group-hover:opacity-100 transition-opacity">+</span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Details Boxes */}
      <section className="relative z-10">
        <div className="grid md:grid-cols-3 text-white">
          
          {/* Box 1: Location */}
          <div className="bg-[#0099cc] p-12 text-center hover:bg-[#008fb3] transition duration-300">
            <div className="mb-4 text-4xl">📍</div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Visit Us</h3>
            <p className="text-white/90">
              BPH Maramag<br/>
              Maramag, Bukidnon
            </p>
          </div>

          {/* Box 2: Phone */}
          <div className="bg-[#4db8ff] p-12 text-center hover:bg-[#42aaff] transition duration-300">
             <div className="mb-4 text-4xl">📞</div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Call Us</h3>
            <p className="text-white/90">
              Main: +1 (555) 123-4567<br/>
              Emergency: 911
            </p>
          </div>

          {/* Box 3: Email */}
          <div className="bg-[#0088b5] p-12 text-center hover:bg-[#007aa3] transition duration-300">
            <div className="mb-4 text-4xl">📧</div>
            <h3 className="text-xl font-bold mb-2 uppercase tracking-wide">Email Us</h3>
            <p className="text-white/90">
              bukcare.app@gmail.com<br/>
            </p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;