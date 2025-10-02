import { useState } from "react";
import { Mail } from "lucide-react";
import GradientButton from "../../components/GradientButton";
import { Link } from "react-router-dom";
import { validateEmail } from "../../utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Send request to backend API
      const response = await fetch("/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset link has been sent to your email.");
        console.log("Reset link sent:", data);
      } else {
        setError(data.message || "Failed to send reset link.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">
          Forgot Password?
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter your registered email to receive password reset instructions.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 text-gray-400" size={20} />
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none"
                disabled={isLoading}
              />
            </div>
          </div>

          <GradientButton type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link"}
          </GradientButton>
        </form>

        <p className="text-center text-sm mt-6">
          <Link to="/signin" className="text-blue-600 hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
