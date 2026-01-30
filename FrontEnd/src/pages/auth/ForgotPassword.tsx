import { useState, type FormEvent } from "react";
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { validateEmail, validatePassword, validateConfirmPassword } from "@/services/validation";
import { forgotPassword, verifyOtp, resetPassword } from "@/services/auth/ForgotPasswordAPI";

// --- TYPES ---
type Step = "email" | "otp" | "reset";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // --- STATE ---
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- HANDLERS ---
  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // Send OTP (used for initial send and resend)
  const sendOtpCode = async () => {
    resetMessages();
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) return  false;

    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("Verification code sent to your email!");
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send verification code. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: Email submit
  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (await sendOtpCode()) setStep("otp");
  };

  // STEP 2: OTP verify
  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (otp.length !== 6) return setError("Please enter the 6-digit OTP sent to your email.");

    setIsLoading(true);
    try {
      await verifyOtp(email, otp);
      setSuccess("OTP verified successfully!");
      setTimeout(() => {
        setSuccess("");
        setStep("reset");
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Password reset
  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    resetMessages();

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) return setError(passwordCheck.message);

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.isValid) return setError(confirmCheck.message);

    setIsLoading(true);
    try {
      await resetPassword(email, newPassword);
      setSuccess("Password reset successful! Redirecting...");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800 flex flex-col">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/50 p-8 relative overflow-hidden"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                {step === "email" && <Mail className="w-8 h-8 text-blue-600" />}
                {step === "otp" && <KeyRound className="w-8 h-8 text-blue-600" />}
                {step === "reset" && <Lock className="w-8 h-8 text-blue-600" />}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {step === "email" && "Forgot Password?"}
                {step === "otp" && "Enter OTP"}
                {step === "reset" && "Reset Password"}
              </h1>

              <p className="text-slate-500 text-sm">
                {step === "email" && "Enter your email to receive a code."}
                {step === "otp" && `We sent a code to ${email}`}
                {step === "reset" && "Create your new secure password."}
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-100">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm flex items-start gap-3 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{success}</p>
              </motion.div>
            )}

            {/* --- STEP FORMS --- */}

            {/* STEP 1: EMAIL */}
            {step === "email" && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  icon={<Mail className="w-5 h-5" />}
                />
                <SubmitButton isLoading={isLoading} text="Send Code" />
                <div className="text-center pt-2">
                  <Link to="/signin" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </form>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <InputField
                  label="Verification Code"
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  icon={<KeyRound className="w-5 h-5" />}
                  className="tracking-[0.5em] font-mono text-center pl-12"
                />
                <SubmitButton isLoading={isLoading} text="Verify OTP" />
                <div className="text-center text-sm text-slate-500 pt-2">
                  Didn’t receive the code?{" "}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={sendOtpCode}
                    className="text-blue-600 font-bold hover:underline disabled:opacity-50"
                  >
                    Resend
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-4"
                >
                  Change Email Address
                </button>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === "reset" && (
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <InputField
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  showToggle
                  isVisible={showNewPassword}
                  onToggle={() => setShowNewPassword((v) => !v)}
                />
                <InputField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  showToggle
                  isVisible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((v) => !v)}
                />
                <SubmitButton isLoading={isLoading} text="Reset Password" />
              </form>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- REUSABLE UI COMPONENTS ---

function InputField({
  label,
  icon,
  type,
  className = "",
  showToggle = false,
  isVisible,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ReactNode;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          {icon}
        </div>
        <input
          {...props}
          type={showToggle ? (isVisible ? "text" : "password") : type}
          className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400 ${className}`}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition"
            tabIndex={-1}
          >
            {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ isLoading, text }: { isLoading: boolean; text: string }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-600/30 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        text
      )}
    </button>
  );
}
