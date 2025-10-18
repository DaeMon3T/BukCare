/**
 * Enhanced validation utilities with specific error messages
 */

export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) return { isValid: false, message: 'Email is required' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);

  return {
    isValid,
    message: isValid ? '' : 'Please enter a valid email address'
  };
}

/**
 * Validate password with strength requirements
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) return { isValid: false, message: 'Password is required' };

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;

  if (!isValid) {
    const messages: string[] = [];
    if (!hasMinLength) messages.push('at least 8 characters');
    if (!hasUpperCase) messages.push('one uppercase letter');
    if (!hasLowerCase) messages.push('one lowercase letter');
    if (!hasNumbers) messages.push('one number');

    return {
      isValid: false,
      message: `Password must contain ${messages.join(', ')}`
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate password confirmation match
 */
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!password || !confirmPassword) {
    return { isValid: false, message: 'Please enter both passwords' };
  }
  
  const isValid = password === confirmPassword;
  return {
    isValid,
    message: isValid ? '' : 'Passwords do not match'
  };
}

/**
 * Validate Philippine phone number format (09XXXXXXXXX)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) return { isValid: false, message: 'Phone number is required' };

  const isValid = /^09\d{9}$/.test(phone);
  return {
    isValid,
    message: isValid ? '' : 'Please enter a valid Philippine phone number (09XXXXXXXXX)'
  };
}

/**
 * Validate name field
 */
export function validateName(name: string | undefined | null): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate date of birth (must be in past and at least 13 years old)
 */
export function validateDOB(dateOfBirth: string | undefined | null): ValidationResult {
  if (!dateOfBirth) {
    return { isValid: false, message: 'Date of birth is required' };
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (birthDate >= today) {
    return { isValid: false, message: 'Date of birth must be in the past' };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 13) {
    return { isValid: false, message: 'You must be at least 13 years old' };
  }

  if (age > 120) {
    return { isValid: false, message: 'Please enter a valid date of birth' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate sex selection
 */
export function validateSex(sex: string): ValidationResult {
  if (!sex) {
    return { isValid: false, message: 'Please select your sex' };
  }

  if (!['0', '1'].includes(sex)) {
    return { isValid: false, message: 'Invalid sex selection' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate province selection
 */
export function validateProvince(provinceId: string): ValidationResult {
  if (!provinceId || provinceId.trim() === '') {
    return { isValid: false, message: 'Province is required' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate city/municipality selection
 */
export function validateCity(cityId: string): ValidationResult {
  if (!cityId || cityId.trim() === '') {
    return { isValid: false, message: 'City/Municipality is required' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate barangay selection
 */
export function validateBarangay(barangay: string): ValidationResult {
  if (!barangay || barangay.trim() === '') {
    return { isValid: false, message: 'Barangay is required' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate PRC License Number
 */
export function validatePRCLicense(licenseNumber: string): ValidationResult {
  if (!licenseNumber || licenseNumber.trim() === '') {
    return { isValid: false, message: 'PRC License Number is required' };
  }

  const trimmed = licenseNumber.trim();

  if (trimmed.length < 6) {
    return { isValid: false, message: 'License number must be at least 6 characters' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, message: 'License number must not exceed 20 characters' };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { isValid: false, message: 'License number can only contain letters, numbers, and hyphens' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate years of experience
 */
export function validateYearsOfExperience(years: string | undefined): ValidationResult {
  if (!years || years.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }

  const yearsNum = Number(years);

  if (isNaN(yearsNum)) {
    return { isValid: false, message: 'Years of experience must be a number' };
  }

  if (yearsNum < 0) {
    return { isValid: false, message: 'Years of experience cannot be negative' };
  }

  if (yearsNum > 70) {
    return { isValid: false, message: 'Years of experience seems too high' };
  }

  if (!Number.isInteger(yearsNum)) {
    return { isValid: false, message: 'Years of experience must be a whole number' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate specialization selection (at least one required)
 */
export function validateSpecializations(specializations: string[]): ValidationResult {
  if (!specializations || specializations.length === 0) {
    return { isValid: false, message: 'Please select at least one specialization' };
  }

  if (specializations.length > 10) {
    return { isValid: false, message: 'You can select a maximum of 10 specializations' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate custom specialization text
 */
export function validateCustomSpecialization(specialization: string): ValidationResult {
  if (!specialization || specialization.trim() === '') {
    return { isValid: true, message: '' }; // Optional field
  }

  const trimmed = specialization.trim();

  if (trimmed.length < 3) {
    return { isValid: false, message: 'Specialization must be at least 3 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, message: 'Specialization must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { isValid: false, message: 'Specialization can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate file upload (image only, max 5MB)
 */
export function validateFileUpload(file: File | null | undefined, fieldName: string): ValidationResult {
  if (!file) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const maxSizeInMB = 5;
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (file.size > maxSizeInBytes) {
    return { isValid: false, message: `${fieldName} must be smaller than ${maxSizeInMB}MB` };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, message: `${fieldName} must be JPG, PNG, or WebP format` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate all doctor files together
 */
export function validateAllFiles(
  prcLicenseFront: File | null | undefined,
  prcLicenseBack: File | null | undefined,
  prcLicenseSelfie: File | null | undefined
): ValidationResult {
  const prcCheck = validateFileUpload(prcLicenseFront, 'PRC License Front');
  if (!prcCheck.isValid) return prcCheck;

  const prcBackCheck = validateFileUpload(prcLicenseBack, 'PRC License Back');
  if (!prcBackCheck.isValid) return prcBackCheck;

  const selfieCheck = validateFileUpload(prcLicenseSelfie, 'PRC License Selfie');
  if (!selfieCheck.isValid) return selfieCheck;

  return { isValid: true, message: '' };
}

/**
 * Complete validation for patient profile
 */
export function validatePatientProfile(data: {
  sex: string;
  dob: string;
  contact_number: string;
  password: string;
  confirmPassword: string;
  province_id: string;
  city_id: string;
  barangay: string;
}): ValidationResult {
  const checks = [
    validateSex(data.sex),
    validateDOB(data.dob),
    validatePhone(data.contact_number),
    validatePassword(data.password),
    validateConfirmPassword(data.password, data.confirmPassword),
    validateProvince(data.province_id),
    validateCity(data.city_id),
    validateBarangay(data.barangay),
  ];

  for (const check of checks) {
    if (!check.isValid) return check;
  }

  return { isValid: true, message: '' };
}

/**
 * Complete validation for doctor profile
 */
export function validateDoctorProfile(data: {
  sex: string;
  dob: string;
  contact_number: string;
  password: string;
  confirmPassword: string;
  province_id: string;
  city_id: string;
  barangay: string;
  license_number: string;
  years_of_experience?: string;
  specializations: string[];
  otherSpecialization?: string;
  prc_license_front?: File | null;
  prc_license_back?: File | null;
  prc_license_selfie?: File | null;
}): ValidationResult {
  const patientCheck = validatePatientProfile(data);
  if (!patientCheck.isValid) return patientCheck;

  const checks = [
    validatePRCLicense(data.license_number),
    validateYearsOfExperience(data.years_of_experience),
    validateSpecializations(data.specializations),
  ];

  for (const check of checks) {
    if (!check.isValid) return check;
  }

  if (data.otherSpecialization) {
    const customSpecCheck = validateCustomSpecialization(data.otherSpecialization);
    if (!customSpecCheck.isValid) return customSpecCheck;
  }

  const filesCheck = validateAllFiles(
    data.prc_license_front,
    data.prc_license_back,
    data.prc_license_selfie
  );
  if (!filesCheck.isValid) return filesCheck;

  return { isValid: true, message: '' };
}