// ============================================
// FILE: CompleteProfile.tsx - FIXED VERSION
// ============================================
import React, { useState } from "react";
import type { ChangeEvent as ReactChangeEvent, FormEvent as ReactFormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import Footer from "@/components/Footer";
import { completeProfile } from "@/services/auth/CompleteProfileAPI";
import { validateDoctorProfile, validatePatientProfile } from "@/services/validation";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleSelection from "./components/RoleSelection";
import ProfileForm from "./components/ProfileForm";
import { useLocationData } from "./hooks/useLocationData";
import type { FormData as ProfileFormData, GoogleData } from "./types";

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState = location.state || {};

  // --------------------------------------------
  // Extract query parameters
  // --------------------------------------------
  const searchParams = new URLSearchParams(location.search);
  const queryUserId = searchParams.get("user_id");
  const queryEmail = searchParams.get("email");
  const queryFname = searchParams.get("fname");
  const queryLname = searchParams.get("lname");
  const queryPictureRaw = searchParams.get("picture");

  const queryPicture = queryPictureRaw ? decodeURIComponent(queryPictureRaw) : "";
  const userId = queryUserId || locationState.user_id || user?.user_id;

  // --------------------------------------------
  // Merge data from query, state, or auth user
  // --------------------------------------------
  const googleData: GoogleData = {
    email: queryEmail || locationState.email || user?.email || "",
    fname: queryFname || locationState.fname || user?.fname || "",
    lname: queryLname || locationState.lname || user?.lname || "",
    picture: queryPicture || locationState.picture || user?.picture || "",
  };

  // --------------------------------------------
  // State - Added barangay_id field
  // --------------------------------------------
  const [role, setRole] = useState<"doctor" | "patient" | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    sex: "",
    dob: "",
    contact_number: "",
    password: "",
    confirmPassword: "",
    barangay: "",
    barangay_id: "", // Added for PSGC code
    city_id: "",
    province_id: "",
    zip_code: "", // Added to satisfy type requirement
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
  // Province/City/Barangay data
  // --------------------------------------------
  const { provincesData, citiesData, barangaysData, loading: loadingProvinces } = useLocationData(
    formData.province_id,
    formData.city_id
  );

  // --------------------------------------------
  // Handlers
  // --------------------------------------------
  const handleChange = (e: ReactChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      // Also extract and save zip_code when city changes
      const selectedCity = citiesData?.find((c: any) => String(c.city_id) === String(value));
      setFormData({
        ...formData,
        [name]: value,
        barangay: "",
        barangay_id: "",
        zip_code: selectedCity?.zip_code || "",
      });
    } else if (name === "barangay_id") {
      // When barangay changes, save both ID and name
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

  // --------------------------------------------
  // Submit Handler - FIXED
  // --------------------------------------------
  const handleSubmit = async (e: ReactFormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const validationResult =
      role === "doctor"
        ? validateDoctorProfile(formData)
        : validatePatientProfile(formData);

    if (!validationResult.isValid) {
      setError(validationResult.message);
      setLoading(false);
      return;
    }

    try {
      // Use browser's FormData (not your custom type)
      const payload = new FormData();
      
      payload.append("user_id", String(userId));
      payload.append("role", role || "");
      payload.append("sex", formData.sex);
      payload.append("dob", formData.dob);
      payload.append("contact_number", formData.contact_number);
      payload.append("password", formData.password);

      // Send BOTH IDs and Names for location data
      payload.append("province_id", formData.province_id);
      payload.append("city_id", formData.city_id);
      payload.append("barangay_id", formData.barangay_id || formData.barangay); // Fallback to name if ID missing

      const provinceName = getProvinceNameById(formData.province_id);
      const cityName = getCityNameById(formData.city_id);
      const barangayName = formData.barangay || getBarangayNameById(formData.barangay_id);

      payload.append("province_name", provinceName);
      payload.append("city_name", cityName);
      payload.append("barangay_name", barangayName);

      if (role === "doctor") {
        if (formData.license_number)
          payload.append("license_number", formData.license_number);
        if (formData.years_of_experience)
          payload.append("years_of_experience", formData.years_of_experience);
        if (formData.specializations.length)
          payload.append("specializations", JSON.stringify(formData.specializations));

        if (formData.prc_license_front)
          payload.append("prc_license_front", formData.prc_license_front);
        if (formData.prc_license_back)
          payload.append("prc_license_back", formData.prc_license_back);
        if (formData.prc_license_selfie)
          payload.append("prc_license_selfie", formData.prc_license_selfie);
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
  // Render
  // --------------------------------------------
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-r from-blue-700 to-[#2dc7f8] text-white">
        <nav className="flex items-center justify-between px-8 py-4 bg-[#1A1A40]/80 shadow sticky top-0 z-10">
          <Link to="/" className="text-2xl font-bold text-[#FFC43D]">
            BukCare
          </Link>

          <div className="space-x-6">
            {!user ? (
              <>
                <Link to="/signin" className="hover:underline text-[#FFC43D]">
                  Sign In
                </Link>
                <Link to="/signup" className="hover:underline">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <span className="font-semibold text-[#FFC43D]">
                  Hi, {user?.fname || "User"}!
                </span>
                <button className="hover:underline text-red-400 font-semibold">
                  Logout
                </button>
              </>
            )}
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