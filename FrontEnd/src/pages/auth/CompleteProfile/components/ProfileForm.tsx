import React, { useState, useMemo } from "react";
import type { FormData, GoogleData, ProvinceData, CityData, BarangayData } from "../types";
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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
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
    () => validateConfirmPassword(formData.password, formData.confirmPassword),
    [formData.password, formData.confirmPassword]
  );

  const passwordHasError = formData.password && formData.password.length > 0 && !passwordValidation.isValid;
  const confirmPasswordHasError = formData.confirmPassword && formData.confirmPassword.length > 0 && !confirmPasswordValidation.isValid;

  return (
    <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-2xl shadow-2xl border border-white/20 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40">
      <button onClick={onBack} className="text-sm text-white/80 hover:text-white mb-3">
        ← Back
      </button>

      <h2 className="text-3xl font-bold mb-6 text-center text-white">
        Complete Your <span className="text-[#FFC43D] capitalize">{role}</span> Profile
      </h2>

      <div className="flex flex-col items-center mb-6">
        <img
          src={googleData.picture || "/default-avatar.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-[#FFC43D] mb-3"
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

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-white/90">Email</label>
          <input
            type="email"
            value={googleData.email}
            readOnly
            className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white/90">Sex</label>
            <select
              name="sex"
              value={formData.sex}
              onChange={onChange}
              className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
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
            <label className="block text-sm font-medium mb-2 text-white/90">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={onChange}
              className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-white/90">Contact Number</label>
          <input
            type="tel"
            name="contact_number"
            placeholder="09XXXXXXXXX"
            value={formData.contact_number}
            onChange={onChange}
            className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
          />
        </div>

        <AddressSection
          formData={formData}
          provincesData={provincesData}
          citiesData={citiesData}
          barangaysData={barangaysData}
          loadingProvinces={loadingProvinces}
          onChange={onChange}
        />

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

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-white/90">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={onChange}
              className={`w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 transition-colors duration-200 pr-12 ${
                passwordHasError
                  ? "focus:ring-2 focus:ring-red-500/70 border-2 border-red-500/50"
                  : "focus:ring-2 focus:ring-[#FFC43D]/70"
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
              <div className="flex items-center gap-1 mt-2 text-red-300 text-xs">
                <AlertCircle size={14} />
                <span>{passwordValidation.message}</span>
              </div>
            )}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-2 text-white/90">Confirm Password</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={onChange}
              className={`w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 transition-colors duration-200 pr-12 ${
                confirmPasswordHasError
                  ? "focus:ring-2 focus:ring-red-500/70 border-2 border-red-500/50"
                  : "focus:ring-2 focus:ring-[#FFC43D]/70"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-10 text-white/60 hover:text-white/90 transition-colors"
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {confirmPasswordHasError && (
              <div className="flex items-center gap-1 mt-2 text-red-300 text-xs">
                <AlertCircle size={14} />
                <span>{confirmPasswordValidation.message}</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#FFC43D] hover:bg-[#FFD75A] text-[#1A1A40] font-bold py-3.5 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-70"
        >
          {loading ? "Saving..." : "Complete Profile"}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
export { ProfileForm };