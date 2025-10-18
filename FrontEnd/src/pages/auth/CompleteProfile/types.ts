// ============================================
// types.ts
// ============================================
export interface GoogleData {
  email: string;
  fname: string;
  lname: string;
  picture: string;
}

export interface FormData {
  sex: string;
  dob: string;
  contact_number: string;
  password: string;
  confirmPassword: string;
  barangay: string;
  city_id: string;
  province_id: string;
  zip_code: string;
  license_number?: string;
  years_of_experience?: string;
  prc_license_front?: File | null;
  prc_license_back?: File | null;
  prc_license_selfie?: File | null;
  specializations?: string[];
  otherSpecialization?: string;
}

export interface ProvinceData {
  province_id: string;
  name: string;
}

export interface CityData {
  city_id: string;
  name: string;
  zip_code: string;
  province_id: string;
}

export interface BarangayData {
  barangay_id: string;
  name: string;
  city_id: string;
}

export interface PhProvince {
  code: string;
  name: string;
}

export interface PhCity {
  code: string;
  name: string;
  fullName?: string;
  zip_code?: string;
  province_code?: string;
  province?: string;
}

export interface PhBarangay {
  code: string;
  name: string;
  city_code: string;
}