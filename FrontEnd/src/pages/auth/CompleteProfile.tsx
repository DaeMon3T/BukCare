  import React, { useState, ChangeEvent, FormEvent, Component } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import { useAuth } from "@/context/AuthContext";
  import Footer from "@/components/Footer";
  import { completeProfile } from "@/services/auth/CompleteProfileAPI";
  import { validateDOB, validatePhone } from "@/utils/validation";

  // Simple Error Boundary Component
  class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-red-500 text-white p-4">
            <h2>Something went wrong. Please try refreshing the page.</h2>
            <p>{this.state.error && this.state.error.toString()}</p>
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
    specializations?: string[];  // Stores selected IDs as strings
  }

  // Premade list of specializations
  const premadeSpecializations = [
    { id: 1, name: 'Cardiology' },
    { id: 2, name: 'Pediatrics' },
    { id: 3, name: 'Neurology' },
    { id: 4, name: 'Orthopedics' },
    { id: 5, name: 'Dermatology' },
    { id: 6, name: 'Psychiatry' },
    { id: 7, name: 'Oncology' },
    { id: 8, name: 'General Surgery' },
  ];

  const CompleteProfile: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, login } = useAuth();

    const locationState = location.state || {};
    const userId = user?.user_id || locationState.user_id;

    const googleData: GoogleData = {
      email: user?.email || locationState.email || "",
      fname: user?.fname || locationState.fname || "",
      lname: user?.lname || locationState.lname || "",
      picture: user?.picture || locationState.picture || "",
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
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>) => {
      console.log('Handling change for field:', e.target.name);
      setFormData({ ...formData, [e.target.name]: e.target.value });
      if (error) setError("");
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      const { name, files } = e.target;
      console.log('Handling file change for:', name);
      if (files?.[0]) setFormData({ ...formData, [name]: files[0] });
    };

    const handleSpecializationChange = (e: ChangeEvent<HTMLSelectElement>) => {
      console.log('Handling specialization change');
      const selected = Array.from(e.target.selectedOptions, (option) => option.value);
      setFormData({ ...formData, specializations: selected });
    };

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      console.log('Submitting form with role:', role);
      setError("");
      setLoading(true);

      if (!formData.sex || !validateDOB(formData.dob)) {
        console.log('Validation error: Personal info incomplete');
        return setError("Please complete your personal information properly"), setLoading(false);
      }
      if (!validatePhone(formData.contact_number)) {
        console.log('Validation error: Invalid phone number');
        return setError("Enter a valid Philippine phone number"), setLoading(false);
      }
      if (formData.password.length < 8) {
        console.log('Validation error: Password too short');
        return setError("Password must be at least 8 characters"), setLoading(false);
      }
      if (formData.password !== formData.confirmPassword) {
        console.log('Validation error: Passwords do not match');
        return setError("Passwords do not match"), setLoading(false);
      }

      if (role === "doctor") {
        if (!formData.license_number) {
          console.log('Validation error: License number required');
          return setError("License number is required"), setLoading(false);
        }
        if (!formData.prc_license_url || !formData.selfie_with_prc_url) {
          console.log('Validation error: PRC documents required');
          return setError("Please upload required PRC documents"), setLoading(false);
        }
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
          payload.append("specializations", JSON.stringify(formData.specializations || []));
          if (formData.prc_license_url) payload.append("prc_license_url", formData.prc_license_url);
          if (formData.selfie_with_prc_url) payload.append("selfie_with_prc_url", formData.selfie_with_prc_url);
          if (formData.id_back_front_url) payload.append("id_back_front_url", formData.id_back_front_url);
        }

        console.log('Sending payload to completeProfile API');
        const data = await completeProfile(payload);
        console.log('API response:', data);
        login(data.tokens, data.user);
        navigate(role === "doctor" ? "/doctor/dashboard" : "/patient/home", { replace: true });
      } catch (err: any) {
        console.error('Error in handleSubmit:', err);
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white flex flex-col">
          <header className="px-8 py-6">
            <h1 className="text-2xl font-bold text-[#FFC43D] tracking-wide">BukCare</h1>
          </header>

          <main className="flex-grow flex justify-center px-6 py-8">
            <div className="max-w-2xl w-full bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
              {!role ? (
                <>
                  <h2 className="text-3xl font-bold mb-8 text-center">
                    Choose Your <span className="text-[#FFC43D]">Role</span>
                  </h2>
                  <div className="flex flex-col gap-4">
                    <button onClick={() => setRole("patient")} className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg">
                      I am a Patient
                    </button>
                    <button onClick={() => setRole("doctor")} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg">
                      I am a Doctor
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setRole(null)} className="text-sm text-white/80 hover:text-white mb-3">← Back to role selection</button>
                  <h2 className="text-3xl font-bold mb-8 text-center">Complete Your <span className="text-[#FFC43D] capitalize">{role}</span> Profile</h2>
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/20">
                    {googleData.picture ? (
                      <img src={googleData.picture} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#FFC43D]" />
                    ) : (
                      <div className="w-16 h-16 bg-[#FFC43D] text-[#1A1A40] flex items-center justify-center font-bold text-xl rounded-full">
                        {googleData.fname?.[0] || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-lg">{`${googleData.fname} ${googleData.lname}`}</p>
                      <p className="text-sm text-white/70">{googleData.email}</p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-400 text-red-100 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">Email</label>
                      <input type="email" value={googleData.email} readOnly className="w-full px-4 py-3 rounded-lg bg-gray-200 text-gray-600 font-medium cursor-not-allowed" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">Sex</label>
                        <select name="sex" value={formData.sex} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]">
                          <option value="">Select sex</option>
                          <option value="1">Male</option>
                          <option value="0">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/90">Date of Birth</label>
                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">Contact Number</label>
                      <input type="tel" name="contact_number" placeholder="09XXXXXXXXX" value={formData.contact_number} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                    </div>

                    {role === "doctor" && (
                      <div className="bg-white/5 rounded-xl p-6 space-y-5 border border-white/10 shadow-md">
                        <h3 className="text-lg font-bold text-[#FFC43D] mb-4">Professional Information</h3>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white/90">PRC License Number *</label>
                          <input type="text" name="license_number" placeholder="Enter license number" value={formData.license_number} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-white/90">Years of Experience</label>
                          <input type="number" name="years_of_experience" placeholder="e.g., 5" value={formData.years_of_experience} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-2 text-white/90">Specializations</label>
                          <select
                            multiple
                            name="specializations"
                            onChange={handleSpecializationChange}
                            className="w-full px-4 py-3 rounded-lg border border-[#FFC43D] bg-white/20 text-white font-medium h-40 focus:ring-2 focus:ring-[#FFC43D] focus:border-transparent overflow-auto"
                          >
                            {premadeSpecializations.map((spec) => (
                              <option key={spec.id} value={spec.id}>
                                {spec.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-white/60 mt-2">Hold Ctrl (Cmd on Mac) to select multiple. Select your areas of expertise.</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-white/90">PRC License Document *</label>
                            <input type="file" name="prc_license_url" onChange={handleFileChange} accept="image/*,application/pdf" className="w-full text-sm text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-[#FFC43D] file:text-[#1A1A40] file:font-semibold hover:file:bg-[#FFD75A]" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2 text-white/90">Selfie with PRC *</label>
                            <input type="file" name="selfie_with_prc_url" onChange={handleFileChange} accept="image/*" className="w-full text-sm text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:bg-[#FFC43D] file:text-[#1A1A40] file:font-semibold hover:file:bg-[#FFD75A]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">Password</label>
                      <input type="password" name="password" placeholder="At least 8 characters" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/90">Confirm Password</label>
                      <input type="password" name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 rounded-lg text-black font-medium focus:ring-2 focus:ring-[#FFC43D]" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-[#FFC43D] text-[#1A1A40] font-bold py-3 rounded-lg mt-4 hover:bg-[#FFD75A] transition duration-200 disabled:opacity-50">
                      {loading ? "Completing..." : "Complete Profile"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  };

  export default CompleteProfile;
