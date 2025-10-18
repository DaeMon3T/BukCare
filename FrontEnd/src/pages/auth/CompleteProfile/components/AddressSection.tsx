// ============================================
// components/AddressSection.tsx
// ============================================
import React from "react";
import type { FormData, ProvinceData, CityData, BarangayData } from "../types";

interface AddressSectionProps {
  formData: FormData;
  provincesData: ProvinceData[];
  citiesData: CityData[];
  barangaysData: BarangayData[];
  loadingProvinces: boolean;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({
  formData,
  provincesData,
  citiesData,
  barangaysData,
  loadingProvinces,
  onChange,
}) => {
  return (
    <div className="bg-white/5 rounded-2xl p-6 space-y-5 border border-white/10">
      <h3 className="text-lg font-bold text-[#FFC43D]">Address Information</h3>

      <div className="relative z-50">
        <label className="block text-sm font-medium mb-2 text-white/90">Province</label>
        <select
          name="province_id"
          value={formData.province_id}
          onChange={onChange}
          disabled={loadingProvinces}
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
        >
          <option value="" className="bg-[#1A1A40] text-white">
            Select province
          </option>
          {provincesData.map((p) => (
            <option key={p.province_id} value={p.province_id} className="bg-[#1A1A40] text-white">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative z-40">
        <label className="block text-sm font-medium mb-2 text-white/90">City/Municipality</label>
        <select
          name="city_id"
          value={formData.city_id}
          onChange={onChange}
          disabled={!formData.province_id}
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
        >
          <option value="" className="bg-[#1A1A40] text-white">
            {!formData.province_id ? "Select province first" : "Select city"}
          </option>
          {citiesData.map((c) => (
            <option key={c.city_id} value={c.city_id} className="bg-[#1A1A40] text-white">
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="relative z-30">
        <label className="block text-sm font-medium mb-2 text-white/90">Barangay</label>
        <select
          name="barangay"
          value={formData.barangay}
          onChange={onChange}
          disabled={!formData.city_id}
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white appearance-none cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
        >
          <option value="" className="bg-[#1A1A40] text-white">
            {!formData.city_id ? "Select city first" : "Select barangay"}
          </option>
          {barangaysData.map((b) => (
            <option key={b.barangay_id} value={b.name} className="bg-[#1A1A40] text-white">
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white/90">ZIP Code</label>
        <input
          type="text"
          name="zip_code"
          value={formData.zip_code}
          readOnly
          placeholder="Auto-filled"
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default AddressSection;
export { AddressSection };