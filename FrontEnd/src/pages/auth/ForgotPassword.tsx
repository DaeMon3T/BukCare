import { useState, FormEvent } from "react";
import { Mail, KeyRound, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "@/utils/validation";
import { forgotPassword, verifyOtp, resetPassword } from "@/services/auth/ForgotPasswordAPI";
import Footer from "@/components/Footer";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");

  const navigate = useNavigate();

  // STEP 1: Request OTP
  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.message);
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Verification code sent to your email!");
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email, otp);
      setSuccess("OTP verified successfully!");
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message);
      return;
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) {
      setError(confirmCheck.message);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email, newPassword);
      setSuccess("Password reset successful! Redirecting to sign in...");
      setTimeout(() => navigate("/signin"), 2000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
        <Link to="/" className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </Link>
        <div className="space-x-6">
          <Link to="/signin" className="hover:underline text-[#FFC43D] font-medium">
            Sign In
          </Link>
          <Link to="/signup" className="hover:underline">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-xl">
              {step === "email" && <>Forgot <span className="text-[#FFC43D]">Password?</span></>}
              {step === "otp" && <>Enter <span className="text-[#FFC43D]">OTP</span></>}
              {step === "reset" && <>Set New <span className="text-[#FFC43D]">Password</span></>}
            </h1>
            <p className="text-lg text-white/90">
              {step === "email"
                ? "Enter your email to receive a verification code."
                : step === "otp"
                ? `Enter the 6-digit code sent to ${email}`
                : "Enter and confirm your new password."}
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            {/* STEP 1 - EMAIL FORM */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {error && <Alert color="red" text={error} />}
                {success && <Alert color="green" text={success} />}

                <InputField
                  icon={<Mail size={20} />}
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />

                <Button text={isLoading ? "Sending..." : "Send Code"} disabled={isLoading} />
              </form>
            )}

            {/* STEP 2 - OTP FORM */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {error && <Alert color="red" text={error} />}
                {success && <Alert color="green" text={success} />}

                <InputField
                  icon={<KeyRound size={20} />}
                  label="Verification Code"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                />

                <Button text={isLoading ? "Verifying..." : "Verify OTP"} disabled={isLoading} />

                <div className="text-center text-white/80">
                  Didn’t get the code?{" "}
                  <button
                    type="button"
                    onClick={() =>
                      handleEmailSubmit(new Event("submit") as unknown as FormEvent<HTMLFormElement>)
                    }
                    className="text-[#FFC43D] hover:underline font-semibold"
                  >
                    Resend
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 - RESET PASSWORD FORM */}
            {step === "reset" && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {error && <Alert color="red" text={error} />}
                {success && <Alert color="green" text={success} />}

                <InputField
                  icon={<Lock size={20} />}
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />

                <InputField
                  icon={<Lock size={20} />}
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />

                <Button text={isLoading ? "Resetting..." : "Reset Password"} disabled={isLoading} />
              </form>
            )}

            {/* Back Link */}
            <div className="text-center mt-8 pt-6 border-t border-white/20">
              <span className="text-white/80">
                Remember your password?{" "}
                <Link to="/signin" className="text-[#FFC43D] hover:text-[#FFD84C] transition font-semibold">
                  Back to Sign In
                </Link>
              </span>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-white/60">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-[#FFC43D] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-[#FFC43D] hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ✅ Reusable components
function InputField({ icon, label, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white/90 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50">{icon}</span>
        <input
          {...props}
          className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FFC43D]"
        />
      </div>
    </div>
  );
}

function Button({ text, disabled }: { text: string; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#FFD84C] transition disabled:opacity-50"
    >
      {text}
    </button>
  );
}

function Alert({ color, text }: { color: "red" | "green"; text: string }) {
  const colorMap = {
    red: "bg-red-500/20 border border-red-400/50 text-red-100",
    green: "bg-green-500/20 border border-green-400/50 text-green-100",
  };
  return <div className={`${colorMap[color]} px-4 py-3 rounded-xl`}>{text}</div>;
}
