export default function Contact() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 text-white py-16 text-center">
        <h1 className="text-4xl font-bold mb-2">Get in Touch</h1>
        <p>We’d love to hear from you</p>
      </section>

      {/* Contact Info + Form */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 px-6">
          {/* Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Contact Information</h2>
            <p>📍 Bukidnon Provincial Hospital</p>
            <p>📞 +63 912 345 6789</p>
            <p>📧 support@bukcare.ph</p>
          </div>

          {/* Form */}
          <div className="bg-gray-50 p-8 rounded-2xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Send us a message</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full p-3 border rounded-xl" />
              <input type="email" placeholder="Your Email" className="w-full p-3 border rounded-xl" />
              <textarea placeholder="Your Message" className="w-full p-3 border rounded-xl h-32"></textarea>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition">Submit</button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 py-16 text-white text-center">
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-4 text-left">
          <div className="bg-white text-gray-800 p-4 rounded-lg">💡 How do I book an appointment?</div>
          <div className="bg-white text-gray-800 p-4 rounded-lg">💡 Can staff create accounts?</div>
          <div className="bg-white text-gray-800 p-4 rounded-lg">💡 How secure is my data?</div>
        </div>
      </section>
    </div>
  );
}
