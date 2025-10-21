import React, { useState, useMemo } from "react";
import type {
  FormData,
  GoogleData,
  ProvinceData,
  CityData,
  BarangayData,
} from "../types";
import AddressSection from "./AddressSection";
import DoctorSection from "./DoctorSection";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  validatePassword,
  validateConfirmPassword,
} from "@/utils/validation";

interface ProfileFormProps {
  role: "doctor" | "patient";
  formData: FormData;
  googleData: GoogleData;
  error: string;
  loading: boolean;
  provincesData: ProvinceData[];
  citiesData: CityData[];
  barangaysData: BarangayData[];
  loadingProvinces: boolean;
  onBack: () => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSpecialization: (specId: string) => void;
  onAddOtherSpecialization: () => void;
  onRemoveSpecialization: (idx: number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  role,
  formData,
  googleData,
  error,
  loading,
  provincesData,
  citiesData,
  barangaysData,
  loadingProvinces,
  onBack,
  onChange,
  onFileChange,
  onToggleSpecialization,
  onAddOtherSpecialization,
  onRemoveSpecialization,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time validation
  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  );

  const confirmPasswordValidation = useMemo(
    () =>
      validateConfirmPassword(formData.password, formData.confirmPassword),
    [formData.password, formData.confirmPassword]
  );

  const passwordHasError =
    formData.password &&
    formData.password.length > 0 &&
    !passwordValidation.isValid;

  const confirmPasswordHasError =
    formData.confirmPassword &&
    formData.confirmPassword.length > 0 &&
    !confirmPasswordValidation.isValid;

  // Contact number validation
  const contactHasError =
    formData.contact_number &&
    formData.contact_number.length > 0 &&
    formData.contact_number.length !== 11;

  return (
    <div className="relative bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/20 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40 transition-all duration-300 hover:shadow-2xl">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-white/80 hover:text-white transition-all duration-200"
      >
        ← Back
      </button>

      <h2 className="text-3xl font-extrabold mb-8 text-center text-white tracking-wide">
        Complete Your{" "}
        <span className="text-[#FFC43D] capitalize">{role}</span> Profile
      </h2>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <img
            src={googleData.picture || "/default-avatar.png"}
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-[#FFC43D] mb-3 shadow-lg"
          />
        </div>
        <h3 className="text-xl font-semibold text-[#FFC43D]">
          {googleData.fname} {googleData.lname}
        </h3>
        <p className="text-white/70 text-sm">{googleData.email}</p>
      </div>

      {error && (
        <div className="bg-[#FFC43D]/20 border border-[#FFC43D]/50 text-[#FFC43D] px-4 py-3 rounded-xl mb-6 text-sm text-center shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/90">
            Email
          </label>
          <input
            type="email"
            value={googleData.email}
            readOnly
            autoComplete="off"
            className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white cursor-not-allowed border border-transparent"
          />
        </div>

        {/* Sex and DOB */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/90">
              Sex
            </label>
            <select
              name="sex"
              value={formData.sex}
              onChange={onChange}
              className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white border border-transparent focus:border-[#FFC43D]/70 focus:ring-2 focus:ring-[#FFC43D]/70 appearance-none cursor-pointer transition-all duration-200"
            >
              <option value="" className="text-black">
                Select
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
              onChange={onChange}
              autoComplete="off"
              className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white border border-transparent focus:border-[#FFC43D]/70 focus:ring-2 focus:ring-[#FFC43D]/70 transition-all duration-200"
            />
          </div>
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/90">
            Contact Number
          </label>
          <input
            type="tel"
            name="contact_number"
            placeholder="09XXXXXXXXX"
            value={formData.contact_number}
            onChange={onChange}
            autoComplete="off"
            className={`w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 border transition-all duration-200 ${
              contactHasError
                ? "border-[#FFC43D] focus:border-[#FFC43D] focus:ring-2 focus:ring-[#FFC43D]/50"
                : "border-transparent focus:border-[#FFC43D]/70 focus:ring-2 focus:ring-[#FFC43D]/70"
            }`}
          />
          {contactHasError && (
            <div className="flex items-center gap-1 mt-2 text-[#FFC43D]/90 text-xs">
              <AlertCircle size={14} />
              <span>Contact number must be 11 digits (09XXXXXXXXX)</span>
            </div>
          )}
        </div>

        {/* Address Section */}
        <AddressSection
          formData={formData}
          provincesData={provincesData}
          citiesData={citiesData}
          barangaysData={barangaysData}
          loadingProvinces={loadingProvinces}
          onChange={onChange}
        />

        {/* Doctor Section */}
        {role === "doctor" && (
          <DoctorSection
            formData={formData}
            onChange={onChange}
            onFileChange={onFileChange}
            onToggleSpecialization={onToggleSpecialization}
            onAddOtherSpecialization={onAddOtherSpecialization}
            onRemoveSpecialization={onRemoveSpecialization}
          />
        )}

        {/* Password + Confirm Password */}
        <div className="grid grid-cols-2 gap-4">
          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-white/90">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={onChange}
              autoComplete="new-password"
              className={`w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 border pr-12 transition-all duration-200 ${
                passwordHasError
                  ? "border-[#FFC43D] focus:border-[#FFC43D] focus:ring-2 focus:ring-[#FFC43D]/50"
                  : "border-transparent focus:border-[#FFC43D]/70 focus:ring-2 focus:ring-[#FFC43D]/70"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 text-white/60 hover:text-white/90 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {passwordHasError && (
              <div className="flex items-center gap-1 mt-2 text-[#FFC43D]/90 text-xs">
                <AlertCircle size={14} />
                <span>{passwordValidation.message}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-white/90">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
              className={`w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 border pr-12 transition-all duration-200 ${
                confirmPasswordHasError
                  ? "border-[#FFC43D] focus:border-[#FFC43D] focus:ring-2 focus:ring-[#FFC43D]/50"
                  : "border-transparent focus:border-[#FFC43D]/70 focus:ring-2 focus:ring-[#FFC43D]/70"
              }`}
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 top-10 text-white/60 hover:text-white/90 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {confirmPasswordHasError && (
              <div className="flex items-center gap-1 mt-2 text-[#FFC43D]/90 text-xs">
                <AlertCircle size={14} />
                <span>{confirmPasswordValidation.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FFC43D] hover:bg-[#FFD75A] text-[#1A1A40] font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70 shadow-lg"
        >
          {loading ? "Saving..." : "Complete Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
export { ProfileForm };