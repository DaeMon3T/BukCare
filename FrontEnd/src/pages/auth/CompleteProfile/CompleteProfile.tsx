import React, { useState, useLayoutEffect, useRef, useEffect } from "react";
import type { ChangeEvent as ReactChangeEvent, FormEvent as ReactFormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { completeProfile } from "@/services/auth/CompleteProfileAPI";
import { validateDoctorProfile, validatePatientProfile } from "@/services/validation";
import ErrorBoundary from "./components/ErrorBoundary";
import { useLocationData } from "./hooks/useLocationData";
import type { FormData as ProfileFormData, GoogleData } from "./types";
// UI Icons
import { 
    User, 
    Stethoscope, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle2, 
    ShieldCheck, 
    MapPin, 
    Upload, 
    X, 
    ChevronDown, 
    Eye, 
    EyeOff,
    Plus,
} from "lucide-react";
import gsap from "gsap";
import logo from "@/assets/images/icon_logo_name.png";

// --- 1. UI COMPONENT: Custom Select (Glass Style) ---
const CustomSelect = ({ label, name, value, options, onChange, disabled = false, placeholder = "Select..." }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">{label}</label>}
      <button 
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left flex justify-between items-center transition-all ${
            disabled ? "opacity-50 cursor-not-allowed" : "focus:bg-white focus:ring-2 focus:ring-[#00aeef]"
        }`}
      >
        <span className={`block truncate ${selectedOption ? "text-slate-900 font-medium" : "text-slate-400"}`}>
            {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
            {options.length > 0 ? (
                options.map((opt: any) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                            // Mimic standard event so your original handleChange works
                            onChange({ target: { name, value: opt.value } });
                            setIsOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-[#00aeef] transition-colors border-b border-slate-50 last:border-0 ${
                            String(value) === String(opt.value) ? "bg-blue-50 text-[#00aeef] font-bold" : "text-slate-600"
                        }`}
                    >
                        {opt.label}
                    </button>
                ))
            ) : (
                <div className="px-4 py-3 text-sm text-slate-400 text-center">No options available</div>
            )}
        </div>
      )}
    </div>
  );
};

// --- 2. UI COMPONENT: Role Card ---
const RoleCard = ({ role, selected, onClick }: { role: "patient" | "doctor", selected: boolean, onClick: () => void }) => (
    <button 
        type="button"
        onClick={onClick}
        className={`relative w-full p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4 group ${
            selected 
            ? "border-[#00aeef] bg-blue-50/50 shadow-xl shadow-blue-500/10" 
            : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-lg"
        }`}
    >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            selected ? "bg-[#00aeef] text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
        }`}>
            {role === "patient" ? <User className="w-8 h-8" /> : <Stethoscope className="w-8 h-8" />}
        </div>
        <div className="text-center">
            <h3 className={`text-lg font-bold transition-colors ${selected ? "text-[#00aeef]" : "text-slate-700"}`}>
                {role === "patient" ? "I am a Patient" : "I am a Doctor"}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
                {role === "patient" ? "Book appointments & manage health." : "Manage clinic & patients."}
            </p>
        </div>
        {selected && <div className="absolute top-4 right-4 text-[#00aeef]"><CheckCircle2 className="w-6 h-6 fill-current" /></div>}
    </button>
);

const CompleteProfile: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState = location.state || {};

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Role, 2 = Form

  // --------------------------------------------
  // Extract query parameters (FROM ORIGINAL CODE)
  // --------------------------------------------
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get("user_id") || locationState.user_id || user?.user_id;
  const queryEmail = searchParams.get("email");
  const queryFname = searchParams.get("fname");
  const queryLname = searchParams.get("lname");
  const queryPictureRaw = searchParams.get("picture");
  const queryPicture = queryPictureRaw ? decodeURIComponent(queryPictureRaw) : "";

  // --------------------------------------------
  // Merge data (FROM ORIGINAL CODE)
  // --------------------------------------------
  const googleData: GoogleData = {
    email: queryEmail || locationState.email || user?.email || "",
    fname: queryFname || locationState.fname || user?.fname || "",
    lname: queryLname || locationState.lname || user?.lname || "",
    picture: queryPicture || locationState.picture || user?.picture || "",
  };

  // --------------------------------------------
  // State (FROM ORIGINAL CODE)
  // --------------------------------------------
  const [role, setRole] = useState<"doctor" | "patient" | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    sex: "",
    dob: "",
    contact_number: "",
    password: "",
    confirmPassword: "",
    barangay: "",
    barangay_id: "",
    city_id: "",
    province_id: "",
    zip_code: "",
    license_number: "",
    years_of_experience: "",
    prc_license_front: null,
    prc_license_back: null,
    prc_license_selfie: null,
    specializations: [],
    otherSpecialization: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------
  // Hooks (FROM ORIGINAL CODE)
  // --------------------------------------------
  const { provincesData, citiesData, barangaysData, loading: _loadingProvinces } = useLocationData(
    formData.province_id,
    formData.city_id
  );

  // Animation Hook (For the new UI)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
        gsap.fromTo(".anim-entry", 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.2 }
        );
        gsap.fromTo(".panel-reveal",
            { x: 20, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.4 }
        );
    }, containerRef);
    return () => ctx.revert();
  }, [step]);

  // --------------------------------------------
  // Handlers (PRESERVED & ADDED LOGIC)
  // --------------------------------------------
  
  // UI Helper: Advance step
  const handleNextStep = () => {
      if (!role) {
          toast.error("Please select a role to continue.");
          return;
      }
      setStep(2);
  };

  const handleChange = (e: ReactChangeEvent<HTMLInputElement | HTMLSelectElement> | any) => {
    const { name, value } = e.target;

    if (name === "province_id") {
      setFormData({
        ...formData,
        [name]: value,
        city_id: "",
        barangay: "",
        barangay_id: "",
        zip_code: "",
      });
    } else if (name === "city_id") {
      const selectedCity = citiesData?.find((c: any) => String(c.city_id) === String(value));
      setFormData({
        ...formData,
        [name]: value,
        barangay: "",
        barangay_id: "",
        zip_code: selectedCity?.zip_code || "",
      });
    } else if (name === "barangay_id") {
      const selectedBarangay = barangaysData?.find((b: any) => String(b.barangay_id) === String(value));
      setFormData({
        ...formData,
        barangay_id: value,
        barangay: selectedBarangay?.name || "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (error) setError("");
  };

  const handleFileChange = (e: ReactChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    }
  };

  // ✅ NEW: SPECIALIZATION HANDLERS (From Original)
  const toggleSpecialization = (specId: string) => {
    const current = formData.specializations;
    const updated = current.includes(specId)
      ? current.filter((id) => id !== specId)
      : [...current, specId];
    setFormData({ ...formData, specializations: updated });
  };

  const handleAddOtherSpecialization = () => {
    if (formData.otherSpecialization?.trim()) {
      const newSpec = formData.otherSpecialization.trim();
      setFormData((prev) => ({
        ...prev,
        specializations: [...prev.specializations, newSpec],
        otherSpecialization: "",
      }));
    }
  };

  const handleRemoveSpecialization = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.filter((_, i) => i !== idx),
    }));
  };

  // Helper functions used in handleSubmit
  const getProvinceNameById = (id: string) => {
    const province = provincesData?.find((p: any) => String(p.province_id) === String(id));
    return province?.name || "";
  };
  const getCityNameById = (id: string) => {
    const city = citiesData?.find((c: any) => String(c.city_id) === String(id));
    return city?.name || "";
  };
  const getBarangayNameById = (id: string) => {
    const barangay = barangaysData?.find((b: any) => String(b.barangay_id) === String(id));
    return barangay?.name || "";
  };

  const handleSubmit = async (e: ReactFormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validationResult = role === "doctor"
        ? validateDoctorProfile(formData)
        : validatePatientProfile(formData);

    if (!validationResult.isValid) {
      setError(validationResult.message);
      setLoading(false);
      return;
    }

    try {
      const payload = new FormData();
      
      payload.append("user_id", String(userId));
      payload.append("role", role || "");
      payload.append("sex", formData.sex); // This sends "true" or "false" string now
      payload.append("dob", formData.dob);
      payload.append("contact_number", formData.contact_number);
      payload.append("password", formData.password);

      payload.append("province_id", formData.province_id);
      payload.append("city_id", formData.city_id);
      payload.append("barangay_id", formData.barangay_id || formData.barangay);

      const provinceName = getProvinceNameById(formData.province_id);
      const cityName = getCityNameById(formData.city_id);
      const barangayName = formData.barangay || getBarangayNameById(formData.barangay_id);

      payload.append("province_name", provinceName);
      payload.append("city_name", cityName);
      payload.append("barangay_name", barangayName);

      if (role === "doctor") {
        if (formData.license_number) payload.append("license_number", formData.license_number);
        if (formData.years_of_experience) payload.append("years_of_experience", formData.years_of_experience);
        // ✅ FIXED: Correctly stringify specializations
        if (formData.specializations.length) payload.append("specializations", JSON.stringify(formData.specializations));
        if (formData.prc_license_front) payload.append("prc_license_front", formData.prc_license_front);
        if (formData.prc_license_back) payload.append("prc_license_back", formData.prc_license_back);
        if (formData.prc_license_selfie) payload.append("prc_license_selfie", formData.prc_license_selfie);
      }

      await completeProfile(payload);

      toast.success("Profile completed successfully! Please sign in to continue.");
      navigate("/signin", { replace: true });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // Render (UPDATED UI)
  // --------------------------------------------
  return (
    <ErrorBoundary>
        <div ref={containerRef} className="bg-white min-h-screen font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white overflow-x-hidden flex flex-col">
            
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
            </div>

            {/* --- NAV BAR --- */}
            <nav className="fixed w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 z-50 h-20 flex items-center px-6 lg:px-12">
                <Link to="/" className="flex items-center gap-2 md:gap-3 group">
                <div className="flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer">
                    {/* Logo */}
                    <img 
                        src={logo} 
                        className="h-25 md:h-30 lg:h-35 w-auto object-contain transition-all duration-300" 
                        alt="BukCare Logo" 
                    />
                </div>
                </Link>
            </nav>

            {/* --- SPLIT LAYOUT --- */}
            <div className="flex-1 flex flex-col lg:flex-row pt-20 min-h-screen">
                
                {/* LEFT: FORM SIDE */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-24 py-12 bg-white relative z-10">
                    <div className="max-w-xl w-full mx-auto">
                        
                        {/* Header */}
                        <div className="mb-8 anim-entry">
                            {step === 2 && (
                                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-4 transition-colors font-medium text-sm">
                                    <ArrowLeft className="w-4 h-4" /> Back to Role Selection
                                </button>
                            )}
                            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
                                {step === 1 ? "Choose your Account Type" : "Complete your Profile"}
                            </h1>
                            <p className="text-slate-500 text-lg">
                                {step === 1 ? "Select how you will use BukCare." : `Please provide your details as a ${role}.`}
                            </p>
                        </div>

                        {/* STEP 1: ROLE SELECTION */}
                        {step === 1 && (
                            <div className="space-y-6 anim-entry">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <RoleCard role="patient" selected={role === "patient"} onClick={() => setRole("patient")} />
                                    <RoleCard role="doctor" selected={role === "doctor"} onClick={() => setRole("doctor")} />
                                </div>
                                <button
                                    onClick={handleNextStep}
                                    disabled={!role}
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#00aeef] hover:shadow-[#00aeef]/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Continue <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* STEP 2: PROFILE FORM */}
                        {step === 2 && (
                            <form onSubmit={handleSubmit} className="space-y-6 anim-entry">
                                
                                {/* 1. Personal Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#00aeef] uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-4 h-4" /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Date of Birth</label>
                                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00aeef] outline-none transition-all" />
                                        </div>
                                        
                                        {/* SEX FIX: sending "true"/"false" strings to satisfy backend boolean requirement */}
                                        <CustomSelect 
                                            label="Gender"
                                            name="sex"
                                            value={formData.sex}
                                            onChange={handleChange}
                                            options={[
                                                { value: "true", label: "Male" }, 
                                                { value: "false", label: "Female" }
                                            ]}
                                            placeholder="Select Gender"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Mobile Number</label>
                                        <input type="tel" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="0912 345 6789" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00aeef] outline-none transition-all" />
                                    </div>
                                </div>

                                {/* 2. Address */}
                                <div className="space-y-4 pt-2">
                                    <h3 className="text-sm font-bold text-[#00aeef] uppercase tracking-wider flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Address
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <CustomSelect 
                                            label="Province"
                                            name="province_id"
                                            value={formData.province_id}
                                            onChange={handleChange}
                                            options={provincesData?.map((p: any) => ({ value: p.province_id, label: p.name })) || []}
                                            placeholder="Select Province"
                                        />
                                        
                                        <CustomSelect 
                                            label="City / Municipality"
                                            name="city_id"
                                            value={formData.city_id}
                                            onChange={handleChange}
                                            disabled={!formData.province_id}
                                            options={citiesData?.map((c: any) => ({ value: c.city_id, label: c.name })) || []}
                                            placeholder="Select City"
                                        />
                                        
                                        <div className="md:col-span-2">
                                            <CustomSelect 
                                                label="Barangay"
                                                name="barangay_id"
                                                value={formData.barangay_id}
                                                onChange={handleChange}
                                                disabled={!formData.city_id}
                                                options={barangaysData?.map((b: any) => ({ value: b.barangay_id, label: b.name })) || []}
                                                placeholder="Select Barangay"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Security */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-[#00aeef] uppercase tracking-wider flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" /> Security
                                        </h3>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs font-bold text-slate-400 hover:text-[#00aeef] flex items-center gap-1 transition-colors">
                                            {showPassword ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00aeef] outline-none transition-all" />
                                        <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#00aeef] outline-none transition-all" />
                                    </div>
                                    {formData.confirmPassword && (
                                        <div className={`text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${formData.password === formData.confirmPassword ? "text-emerald-500" : "text-rose-500"}`}>
                                            {formData.password === formData.confirmPassword ? <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match perfectly.</> : <><X className="w-3.5 h-3.5" /> Passwords do not match.</>}
                                        </div>
                                    )}
                                </div>

                                {/* DOCTOR SPECIFIC FIELDS (WITH SPECIALIZATIONS FIXED) */}
                                {role === "doctor" && (
                                    <div className="space-y-4 pt-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                            <Stethoscope className="w-4 h-4" /> Doctor Credentials
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} placeholder="PRC License Number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] outline-none" />
                                            <input type="number" name="years_of_experience" value={formData.years_of_experience} onChange={handleChange} placeholder="Years Experience" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] outline-none" />
                                        </div>

                                        {/* ✅ SPECIALIZATION SELECTION RESTORED */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase tracking-wider">Specialization</label>
                                            <CustomSelect 
                                                name="specializationSelect"
                                                value=""
                                                onChange={(e: any) => toggleSpecialization(e.target.value)}
                                                options={[
                                                    "General Practice", "Cardiology", "Dermatology", "Neurology", 
                                                    "Pediatrics", "Psychiatry", "Surgery", "Orthopedics", 
                                                    "Ophthalmology", "Radiology"
                                                ].map(s => ({ value: s, label: s }))}
                                                placeholder="Add Specialization..."
                                            />
                                            
                                            {/* Other Specialization Input */}
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    name="otherSpecialization"
                                                    value={formData.otherSpecialization}
                                                    onChange={handleChange}
                                                    placeholder="Or type other specialization..."
                                                    className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00aeef] outline-none"
                                                />
                                                <button type="button" onClick={handleAddOtherSpecialization} className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition-colors">
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Selected Specializations Tags */}
                                            {formData.specializations.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.specializations.map((spec, idx) => (
                                                        <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                            {spec}
                                                            <button type="button" onClick={() => handleRemoveSpecialization(idx)} className="hover:text-red-500">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Upload PRC ID (Front/Back/Selfie)</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['prc_license_front', 'prc_license_back', 'prc_license_selfie'].map((field) => (
                                                    <label key={field} className="h-24 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-[#00aeef] hover:text-[#00aeef] hover:bg-blue-50 transition cursor-pointer text-xs text-center p-2">
                                                        <Upload className="w-5 h-5 mb-1" />
                                                        {field.replace('prc_license_', '').toUpperCase()}
                                                        <input type="file" name={field} onChange={handleFileChange} className="hidden" accept="image/*" />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error & Submit */}
                                {error && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2 animate-pulse">
                                        <X className="w-4 h-4" /> {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-[#00aeef] hover:shadow-[#00aeef]/30 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Complete Setup"
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* RIGHT: VISUAL SIDE (Same as Sign In) */}
                <div className="hidden lg:flex w-1/2 bg-[#F0F9FF] relative items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2068&auto=format&fit=crop" 
                            alt="Medical Team" 
                            className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#00aeef]/90 to-slate-900/60 mix-blend-multiply"></div>
                    </div>

                    <div className="panel-reveal relative z-10 w-full max-w-lg px-12 text-white">
                        <div className="mb-12">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl mb-8">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-5xl font-extrabold leading-[1.1] mb-6">
                                Almost There.
                            </h2>
                            <p className="text-blue-100 text-lg leading-relaxed font-light">
                                Just a few more details to personalize your healthcare experience on BukCare.
                            </p>
                        </div>
                        
                        {/* User Card Preview */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex items-center gap-4">
                            <img src={googleData.picture || `https://ui-avatars.com/api/?name=${googleData.fname}+${googleData.lname}`} className="w-14 h-14 rounded-full border-2 border-white" alt="Avatar"/>
                            <div>
                                <p className="font-bold text-lg">{googleData.fname} {googleData.lname}</p>
                                <p className="text-sm text-blue-100">{googleData.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </ErrorBoundary>
  );
};

export default CompleteProfile;