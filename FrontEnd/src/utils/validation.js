/**
 * Enhanced email validation with specific error messages
 */
export function validateEmail(email) {
  if (!email) return { isValid: false, message: 'Email is required' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid ? '' : 'Please enter a valid email address'
  };
}
/**
 * Enhanced password validation with strength requirements
 */
export function validatePassword(password) {
  if (!password) return { isValid: false, message: 'Password is required' };
  
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;
  
  if (!isValid) {
    const messages = [];
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
 * Validate password confirmation
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {boolean}
 */
export function validateConfirmPassword(password, confirmPassword) {
  return password === confirmPassword;
}

/**
 * Validate phone number (Philippine format 09XXXXXXXXX)
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
  return /^09\d{9}$/.test(phone);
}

/**
 * Validate required name fields
 * @param {string} name 
 * @returns {boolean}
 */
export function validateName(name) {
  return name && name.trim().length > 0;
}

/**
 * Validate date of birth (must be in the past and minimum 13 years old)
 * @param {string} dateOfBirth - YYYY-MM-DD format
 * @returns {boolean}
 */
export function validateDOB(dateOfBirth) {
  if (!dateOfBirth) return false;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (birthDate >= today) return false;

  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 13;
  }
  return age >= 13;
}

/**
 * Validate OTP format (6 digits)
 * @param {string} otp 
 * @returns {boolean}
 */
export function validateOTP(otp) {
  return /^\d{6}$/.test(otp);
}

/**
 * Validate required fields for general signup
 * @param {Object} userData
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateSignupData(userData) {
  const errors = [];

  if (!validateEmail(userData.email)) errors.push('Please enter a valid email address');
  if (!validateName(userData.first_name)) errors.push('First name is required');
  if (!validateName(userData.last_name)) errors.push('Last name is required');
  if (!validatePhone(userData.contact_number)) errors.push('Please enter a valid Philippine phone number (09XXXXXXXXX)');
  if (!validatePassword(userData.password)) errors.push('Password must be at least 6 characters long');
  if (!userData.sex || !['M', 'F', 'male', 'female'].includes(userData.sex.toLowerCase())) errors.push('Please select a valid gender');
  if (!validateDOB(userData.date_of_birth)) errors.push('Please enter a valid date of birth (must be at least 13 years old)');
  if (!validateName(userData.street)) errors.push('Street address is required');
  if (!validateName(userData.barangay)) errors.push('Barangay is required');
  if (!validateName(userData.city_municipality)) errors.push('City/Municipality is required');
  if (!validateName(userData.province)) errors.push('Province is required');

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required fields for doctor signup
 * @param {Object} doctorData
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateDoctorSignupData(doctorData) {
  const errors = [];

  if (!validateName(doctorData.fname)) errors.push('First name is required');
  if (!validateName(doctorData.lname)) errors.push('Last name is required');
  if (!validateEmail(doctorData.email)) errors.push('Please enter a valid email address');
  if (!validatePhone(doctorData.phone)) errors.push('Please enter a valid Philippine phone number (09XXXXXXXXX)');
  if (!validateName(doctorData.licenseNumber)) errors.push('License number is required');
  if (!validatePassword(doctorData.password)) errors.push('Password must be at least 6 characters long');
  if (!validateConfirmPassword(doctorData.password, doctorData.confirmPassword)) errors.push('Passwords do not match');

  if (!doctorData.specialization || doctorData.specialization.length === 0) {
    errors.push('Please select at least one specialization');
  }

  if (doctorData.specialization.includes('Other') && !validateName(doctorData.otherSpecialization)) {
    errors.push("Please specify your specialization in the 'Other' field");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
