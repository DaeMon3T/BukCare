// src/pages/auth/CompleteProfile.tsx
import React, { useState, ChangeEvent, FormEvent, Component } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { completeProfile } from "@/services/auth/CompleteProfileAPI";
import { validateDOB, validatePhone } from "@/utils/validation";

// Error Boundary
class ErrorBoundary extends Component<any, any> {
  override state = { hasError: false, error: null };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  override componentDidCatch(error: any, errorInfo: any) {
    console.error(error, errorInfo);
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-500 text-white p-4">
          <h2>Something went wrong. Please refresh.</h2>
          <p>{this.state.error?.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface GoogleData {
  email: string;
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
  license_number?: string;
  years_of_experience?: string;
  prc_license_url?: File | null;
  selfie_with_prc_url?: File | null;
  id_back_front_url?: File | null;
  specializations?: string[];
  otherSpecialization?: string;
}

const premadeSpecializations = [
  { id: 1, name: "Cardiology" },
  { id: 2, name: "Pediatrics" },
  { id: 3, name: "Neurology" },
  { id: 4, name: "Orthopedics" },
  { id: 5, name: "Dermatology" },
  { id: 6, name: "Psychiatry" },
  { id: 7, name: "Oncology" },
  { id: 8, name: "General Surgery" },
];

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const locationState = location.state || {};

  // Read from URL query parameters (priority: URL params first)
  const searchParams = new URLSearchParams(location.search);
  const queryUserId = searchParams.get("user_id");
  const queryEmail = searchParams.get("email");
  const queryFname = searchParams.get("fname");
  const queryLname = searchParams.get("lname");
  const queryPicture = searchParams.get("picture");

  const userId = queryUserId || locationState.user_id || user?.user_id;

  const googleData: GoogleData = {
    email: queryEmail || locationState.email || user?.email || "",
    fname: queryFname || locationState.fname || user?.fname || "",
    lname: queryLname || locationState.lname || user?.lname || "",
    picture: queryPicture || locationState.picture || user?.picture || "",
  };

  const [role, setRole] = useState<"doctor" | "patient" | null>(null);
  const [formData, setFormData] = useState<FormData>({
    sex: "",
    dob: "",
    contact_number: "",
    password: "",
    confirmPassword: "",
    license_number: "",
    years_of_experience: "",
    prc_license_url: null,
    selfie_with_prc_url: null,
    id_back_front_url: null,
    specializations: [],
    otherSpecialization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0])
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  const toggleSpecialization = (specId: string) => {
    const current = formData.specializations || [];
    const updated = current.includes(specId)
      ? current.filter((id) => id !== specId)
      : [...current, specId];
    setFormData({ ...formData, specializations: updated });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.sex || !validateDOB(formData.dob)) {
      setError("Complete personal info");
      setLoading(false);
      return;
    }
    if (!validatePhone(formData.contact_number)) {
      setError("Invalid phone");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password too short");
      setLoading(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (
      role === "doctor" &&
      (!formData.license_number ||
        !formData.prc_license_url ||
        !formData.selfie_with_prc_url)
    ) {
      setError("Fill all doctor fields");
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("user_id", String(userId));
      payload.append("role", role || "");
      payload.append("sex", formData.sex);
      payload.append("dob", formData.dob);
      payload.append("contact_number", formData.contact_number);
      payload.append("password", formData.password);

      if (role === "doctor") {
        payload.append("license_number", formData.license_number || "");
        payload.append("years_of_experience", formData.years_of_experience || "");

        // Combine selected specializations with custom "Other" input
        const allSpecs = [...(formData.specializations || [])];
        if (formData.otherSpecialization?.trim()) {
          allSpecs.push(formData.otherSpecialization.trim());
        }
        payload.append("specializations", JSON.stringify(allSpecs));

        if (formData.prc_license_url)
          payload.append("prc_license_url", formData.prc_license_url);
        if (formData.selfie_with_prc_url)
          payload.append("selfie_with_prc_url", formData.selfie_with_prc_url);
        if (formData.id_back_front_url)
          payload.append("id_back_front_url", formData.id_back_front_url);
      }

      const data = await completeProfile(payload);
      login(data.tokens, data.user);
      navigate(
        role === "doctor" ? "/doctor/dashboard" : "/patient/home",
        { replace: true }
      );
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
        <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-[#FFC43D] drop-shadow"
          >
            BukCare
          </Link>
          <div className="space-x-6">
            <Link
              to="/signin"
              className="hover:underline text-[#FFC43D] font-medium"
            >
              Sign In
            </Link>
            <Link to="/signup" className="hover:underline">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
          <div className="max-w-md w-full">
            {!role ? (
              <div className="text-center mb-8 bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Choose Your <span className="text-[#FFC43D]">Role</span>
                </h2>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setRole("patient")}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl"
                  >
                    I am a Patient
                  </button>
                  <button
                    onClick={() => setRole("doctor")}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl"
                  >
                    I am a Doctor
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20">
                <button
                  onClick={() => setRole(null)}
                  className="text-sm text-white/80 hover:text-white mb-3"
                >
                  ← Back to role selection
                </button>
                <h2 className="text-3xl font-bold mb-6 text-center">
                  Complete Your{" "}
                  <span className="text-[#FFC43D] capitalize">{role}</span> Profile
                </h2>

                {/* Google Profile Info */}
                <div className="flex flex-col items-center mb-6">
                  <img
                    src={googleData.picture || "/default-avatar.png"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-[#FFC43D] shadow-lg mb-3"
                  />
                  <h3 className="text-xl font-semibold text-[#FFC43D]">
                    {googleData.fname} {googleData.lname}
                  </h3>
                  <p className="text-white/80 text-sm">{googleData.email}</p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 text-white">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      Email
                    </label>
                    <input
                      type="email"
                      value={googleData.email}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium cursor-not-allowed focus:ring-2 focus:ring-[#FFC43D]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">
                        Sex
                      </label>
                      <select
                        name="sex"
                        value={formData.sex}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 font-medium focus:ring-2 focus:ring-[#FFC43D]"
                      >
                        <option value="" className="text-black">
                          Select sex
                        </option>
                        <option value="1" className="text-black">
                          Male
                        </option>
                        <option value="0" className="text-black">
                          Female
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      placeholder="09XXXXXXXXX"
                      value={formData.contact_number}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                    />
                  </div>

                  {/* Doctor-specific section */}
                  {role === "doctor" && (
                    <div className="bg-white/5 rounded-2xl p-6 space-y-5 border border-white/10 shadow-md text-white">
                      <h3 className="text-lg font-bold text-[#FFC43D] mb-4">
                        Professional Info
                      </h3>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          PRC License Number *
                        </label>
                        <input
                          type="text"
                          name="license_number"
                          placeholder="Enter license number"
                          value={formData.license_number}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          name="years_of_experience"
                          placeholder="e.g., 5"
                          value={formData.years_of_experience}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          Specializations
                        </label>
                        <div className="bg-white/10 rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto border border-white/20">
                          {premadeSpecializations.map((spec) => (
                            <label
                              key={spec.id}
                              className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  formData.specializations?.includes(
                                    String(spec.id)
                                  ) || false
                                }
                                onChange={() =>
                                  toggleSpecialization(String(spec.id))
                                }
                                className="w-4 h-4 rounded border-white/40 text-[#FFC43D] focus:ring-[#FFC43D] focus:ring-offset-0 bg-white/20"
                              />
                              <span className="text-white/90 font-medium">
                                {spec.name}
                              </span>
                            </label>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowOtherInput(!showOtherInput)}
                          className="mt-3 text-sm text-[#FFC43D] hover:text-[#FFD75A] font-medium flex items-center"
                        >
                          {showOtherInput
                            ? "− Hide Other"
                            : "+ Add Other Specialization"}
                        </button>

                        {showOtherInput && (
                          <input
                            type="text"
                            name="otherSpecialization"
                            placeholder="Enter custom specialization"
                            value={formData.otherSpecialization}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D] mt-3"
                          />
                        )}

                        <p className="text-xs text-white/60 mt-2">
                          Select multiple specializations or add a custom one.
                        </p>
                      </div>

                      <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          Front of PRC ID *
                        </label>
                        <input
                          type="file"
                          name="prc_license_url"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full text-sm text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:bg-[#FFC43D] file:text-[#1A1A40] file:font-semibold hover:file:bg-[#FFD75A]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          Back of PRC ID *
                        </label>
                        <input
                          type="file"
                          name="id_back_front_url"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full text-sm text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:bg-[#FFC43D] file:text-[#1A1A40] file:font-semibold hover:file:bg-[#FFD75A]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">
                          Selfie with PRC ID *
                        </label>
                        <input
                          type="file"
                          name="selfie_with_prc_url"
                          onChange={handleFileChange}
                          accept="image/*"
                          className="w-full text-sm text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:bg-[#FFC43D] file:text-[#1A1A40] file:font-semibold hover:file:bg-[#FFD75A]"
                        />
                      </div>
                    </div>

                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/90">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/60 text-white font-medium focus:ring-2 focus:ring-[#FFC43D]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FFC43D] hover:bg-[#FFD75A] text-[#1A1A40] font-bold py-3 rounded-xl shadow-lg transition disabled:opacity-70"
                  >
                    {loading ? "Saving..." : "Complete Profile"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default CompleteProfile;
