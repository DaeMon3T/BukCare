// ============================================
// components/DoctorSection.tsx
// ============================================
import React from "react";
import type { FormData } from "../types";

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

interface DoctorSectionProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleSpecialization: (specId: string) => void;
  onAddOtherSpecialization: () => void;
  onRemoveSpecialization: (idx: number) => void;
}

const DoctorSection: React.FC<DoctorSectionProps> = ({
  formData,
  onChange,
  onFileChange,
  onToggleSpecialization,
  onAddOtherSpecialization,
  onRemoveSpecialization,
}) => {
  return (
    <div className="bg-white/5 rounded-2xl p-6 space-y-5 border border-white/10">
      <h3 className="text-lg font-bold text-[#FFC43D]">Doctor Details</h3>

      <div>
        <label className="block text-sm font-medium mb-2 text-white/90">License Number</label>
        <input
          type="text"
          name="license_number"
          placeholder="PRC License Number"
          value={formData.license_number}
          onChange={onChange}
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white/90">Years of Experience</label>
        <input
          type="number"
          name="years_of_experience"
          placeholder="Enter years of experience"
          value={formData.years_of_experience}
          onChange={onChange}
          className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-white/90">Specializations</label>
        <div className="space-y-3">
          <div className="bg-white/10 rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 hover:scrollbar-thumb-white/40 border border-white/20">
            {premadeSpecializations.map((spec) => (
              <label
                key={spec.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors duration-200"
              >
                <input
                  type="checkbox"
                  checked={formData.specializations?.includes(String(spec.id))}
                  onChange={() => onToggleSpecialization(String(spec.id))}
                  className="w-4 h-4 accent-[#FFC43D] focus:ring-[#FFC43D]"
                />
                <span className="text-white/90">{spec.name}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              name="otherSpecialization"
              placeholder="Enter other specialization"
              value={formData.otherSpecialization}
              onChange={onChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddOtherSpecialization();
                }
              }}
              className="flex-1 px-4 py-3.5 text-base rounded-xl bg-white/20 text-white placeholder-white/60 focus:ring-2 focus:ring-[#FFC43D]/70 transition-colors duration-200"
            />
            <button
              type="button"
              onClick={onAddOtherSpecialization}
              className="px-6 py-3.5 bg-[#FFC43D] hover:bg-[#FFD75A] text-[#1A1A40] font-semibold rounded-xl transition-colors duration-200"
            >
              Add
            </button>
          </div>

          {formData.specializations && formData.specializations.length > 0 && (
            <div className="bg-white/10 rounded-xl p-4 border border-white/20">
              <p className="text-xs font-semibold text-white/70 mb-3">Selected Specializations:</p>
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec, idx) => {
                  const specName =
                    premadeSpecializations.find((s) => String(s.id) === spec)?.name || spec;
                  return (
                    <div
                      key={idx}
                      className="bg-[#FFC43D] text-[#1A1A40] px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium"
                    >
                      <span>{specName}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveSpecialization(idx)}
                        className="text-[#1A1A40] hover:font-bold transition-all"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t border-white/20 pt-5">
        <h4 className="text-base font-semibold text-[#FFC43D]">Document Uploads</h4>

        {["prc_license_front", "prc_license_back", "prc_license_selfie"].map((field, idx) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-2 text-white/90">
              {idx === 0 ? "PRC License Front" : idx === 1 ? "PRC License Back" : "Selfie with PRC License"}
            </label>
            <input
              type="file"
              name={field}
              onChange={onFileChange}
              accept={field === "prc_license_selfie" ? "image/*" : "image/*,.pdf"}
              className="w-full px-4 py-3.5 text-base rounded-xl bg-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#FFC43D] file:text-[#1A1A40] hover:file:bg-[#FFD75A] cursor-pointer"
            />
            {formData[field as keyof FormData] && (
              <p className="text-xs text-[#FFC43D] mt-2">
                ✓ {(formData[field as keyof FormData] as File)?.name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorSection;
export { DoctorSection };