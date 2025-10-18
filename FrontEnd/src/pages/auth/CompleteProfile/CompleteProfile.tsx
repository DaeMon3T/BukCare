// ============================================
// FILE: CompleteProfile.tsx (with debugging)
// ============================================
import React, { useState, useEffect } from "react";
import type { ChangeEvent as ReactChangeEvent, FormEvent as ReactFormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { completeProfile } from "@/services/auth/CompleteProfileAPI";
import {
  validateDoctorProfile,
  validatePatientProfile,
} from "@/utils/validation";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleSelection from "./components/RoleSelection";
import ProfileForm from "./components/ProfileForm";
import { useLocationData } from "./hooks/useLocationData";
import type { FormData, GoogleData } from "./types";

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();
  const locationState = location.state || {};

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
    barangay: "",
    city_id: "",
    province_id: "",
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

  const { provincesData, citiesData, barangaysData, loadingProvinces } = useLocationData(
    formData.province_id,
    formData.city_id
  );

  const handleChange = (e: ReactChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "province_id") {
      setFormData({
        ...formData,
        [name]: value,
        city_id: "",
        barangay: "",
      });
    } else if (name === "city_id") {
      setFormData({
        ...formData,
        [name]: value,
        barangay: "",
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

  const toggleSpecialization = (specId: string) => {
    const current = formData.specializations || [];
    const updated = current.includes(specId)
      ? current.filter((id) => id !== specId)
      : [...current, specId];
    setFormData({ ...formData, specializations: updated });
  };

  const handleAddOtherSpecialization = () => {
    if (formData.otherSpecialization.trim()) {
      const newSpec = formData.otherSpecialization.trim();
      setFormData((prev) => ({
        ...prev,
        specializations: [...(prev.specializations || []), newSpec],
        otherSpecialization: "",
      }));
    }
  };

  const handleRemoveSpecialization = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations?.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: ReactFormEvent) => {
    console.log("🔵 CompleteProfile: handleSubmit called");
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("📋 FormData:", {
      sex: formData.sex,
      dob: formData.dob,
      contact_number: formData.contact_number,
      province_id: formData.province_id,
      city_id: formData.city_id,
      barangay: formData.barangay,
      role: role,
    });

    // Validate formData object FIRST before creating FormData
    const validationResult =
      role === "doctor"
        ? validateDoctorProfile(formData)
        : validatePatientProfile(formData);

    console.log("✓ Validation result:", validationResult);

    if (!validationResult.isValid) {
      console.error("❌ Validation failed:", validationResult.message);
      setError(validationResult.message);
      setLoading(false);
      return;
    }

    try {
      console.log("📦 Creating FormData payload...");
      const payload = new FormData();
      payload.append("user_id", String(userId));
      payload.append("role", role || "");
      
      // Append all form fields
      payload.append("sex", formData.sex);
      payload.append("dob", formData.dob);
      payload.append("contact_number", formData.contact_number);
      payload.append("province_id", formData.province_id);
      payload.append("city_id", formData.city_id);
      payload.append("barangay", formData.barangay);
      payload.append("password", formData.password);
      payload.append("confirmPassword", formData.confirmPassword);

      // Doctor-specific fields
      if (role === "doctor") {
        console.log("🏥 Adding doctor-specific fields...");
        if (formData.license_number)
          payload.append("license_number", formData.license_number);
        if (formData.years_of_experience)
          payload.append("years_of_experience", formData.years_of_experience);
        
        // Convert specializations array to JSON string
        if (formData.specializations && formData.specializations.length > 0) {
          payload.append("specializations", JSON.stringify(formData.specializations));
        }

        // Append file uploads
        if (formData.prc_license_front)
          payload.append("prc_license_front", formData.prc_license_front);
        if (formData.prc_license_back)
          payload.append("prc_license_back", formData.prc_license_back);
        if (formData.prc_license_selfie)
          payload.append("prc_license_selfie", formData.prc_license_selfie);
      }

      console.log("🚀 Calling API: /auth/complete-profile");
      const data = await completeProfile(payload);
      console.log("✅ API Response:", data);
      
      login(data.tokens, data.user);
      console.log("🎉 Profile completed successfully!");
      navigate(role === "doctor" ? "/doctor/dashboard" : "/patient/home", {
        replace: true,
      });
    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-[#1A1A40] via-[#0057B8] to-[#00A8E8] text-white">
        <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
          <Link to="/" className="text-2xl font-bold text-[#FFC43D]">
            BukCare
          </Link>
          <div className="space-x-6">
            <Link to="/signin" className="hover:underline text-[#FFC43D]">
              Sign In
            </Link>
            <Link to="/signup" className="hover:underline">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
          <div className="w-full max-w-2xl">
            {!role ? (
              <RoleSelection onSelectRole={setRole} />
            ) : (
              <ProfileForm
                role={role}
                formData={formData}
                googleData={googleData}
                error={error}
                loading={loading}
                provincesData={provincesData}
                citiesData={citiesData}
                barangaysData={barangaysData}
                loadingProvinces={loadingProvinces}
                onBack={() => setRole(null)}
                onChange={handleChange}
                onFileChange={handleFileChange}
                onToggleSpecialization={toggleSpecialization}
                onAddOtherSpecialization={handleAddOtherSpecialization}
                onRemoveSpecialization={handleRemoveSpecialization}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default CompleteProfile;