// src/pages/patient/CompleteProfile.tsx
import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { completeProfile } from "@/services/auth/CompleteProfileAPI";
import { validateDOB, validatePhone } from "@/utils/validation";

interface GoogleData {
  email: string;
  name: string;
  fname: string;
  lname: string;
  picture: string;
}

interface FormData {
  sex: string;
  dob: string;
  contact_number: string;
  password: string;
  confirmPassword: string;
}

interface CompleteProfileResponse {
  tokens: any;
  user: any;
}

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const userId: string | undefined =
    user?.user_id || location.state?.user_id;

  const googleData: GoogleData = {
    email: user?.email || location.state?.email || "",
    name: user?.name || location.state?.name || "",
    fname: user?.fname || location.state?.fname || "",
    lname: user?.lname || location.state?.lname || "",
    picture: user?.picture || location.state?.picture || "",
  };

  const [formData, setFormData] = useState<FormData>({
    sex: "",
    dob: "",
    contact_number: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.sex) {
      setError("Please select your sex");
      setLoading(false);
      return;
    }
    if (!validateDOB(formData.dob)) {
      setError("Please enter a valid date of birth (at least 13 years old)");
      setLoading(false);
      return;
    }
    if (!validatePhone(formData.contact_number)) {
      setError("Please enter a valid Philippine phone number (09XXXXXXXXX)");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        user_id: String(userId),
        sex: formData.sex,
        dob: formData.dob,
        contact_number: formData.contact_number,
        address_id: null,
        password: formData.password,
      };

      const data: CompleteProfileResponse = await completeProfile(payload);
      login(data.tokens, data.user);
      navigate("/patient/home", { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
      {/* Header */}
      <div className="px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow">
          BukCare
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-xl">
              Complete Your <span className="text-[#FFC43D]">Profile</span>
            </h1>
            <p className="text-lg text-white/90">
              Just a few more details to get you started
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
            {/* Google Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10">
              <div className="flex items-center gap-4 mb-4">
                {googleData.picture ? (
                  <img
                    src={googleData.picture}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-[#FFC43D]"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#FFC43D] flex items-center justify-center text-[#1A1A40] font-bold text-2xl">
                    {googleData.fname?.charAt(0)}
                    {googleData.lname?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{googleData.name}</h3>
                  <p className="text-white/80">{googleData.email}</p>
                </div>
              </div>
              <p className="text-sm text-white/60 italic">
                Connected with Google • Email verified automatically
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Sex */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Sex <span className="text-red-400">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-black"
                >
                  <option value="">Select your sex</option>
                  <option value="1">Male</option>
                  <option value="0">Female</option>
                </select>
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Date of Birth <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  max={new Date().toISOString().split("T")[0]}
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Contact Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  placeholder="09XXXXXXXXX"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                  placeholder="At least 8 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 px-6 rounded-xl mt-4"
              >
                {loading ? "Completing Profile..." : "Complete Profile & Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompleteProfile;
