/**
 * Enhanced email validation with specific error messages
 */
export function validateEmail(email: string): { isValid: boolean; message: string } {
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
export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (!password) return { isValid: false, message: 'Password is required' };

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumbers;

  if (!isValid) {
    const messages: string[] = [];
    if (!hasMinLength) messages.push('at least 8 characters');
    if (!hasUpperCase) messages.push('one uppercase letter');
    if (!hasLowerCase) messages.push('one lowercase letter');
    if (!hasNumbers) messages.push('one number');
    if (!hasSpecialChar) messages.push('one special character');

    return {
      isValid: false,
      message: `Password must contain ${messages.join(', ')}`
    };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate password confirmation
 */
export function validateConfirmPassword(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Validate phone number (Philippine format 09XXXXXXXXX)
 */
export function validatePhone(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/**
 * Validate required name fields
 */
export function validateName(name: string | undefined | null): boolean {
  return !!name && name.trim().length > 0;
}

/**
 * Validate date of birth (must be in the past and minimum 13 years old)
 */
export function validateDOB(dateOfBirth: string | undefined | null): boolean {
  if (!dateOfBirth) return false;

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  if (birthDate >= today) return false;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 13;
}

/**
 * Validate OTP format (6 digits)
 */
export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
