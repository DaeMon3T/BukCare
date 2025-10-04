// ============================================================================
// DoctorSignUpAPI.js - Doctor Registration API Service
// ============================================================================

import BaseAPI from '../BaseAPI';

/**
 * Validate invitation token
 * @param {string} token - Invitation token from URL
 * @returns {Promise<Object>} Invitation data with email and role
 */
export const validateInvitation = async (token) => {
  try {
    const response = await BaseAPI.get(`/auth/validate-invite/${token}`);
    
    // Verify it's a doctor invitation
    if (response.data.role !== 'doctor') {
      throw new Error('This invitation is not for a doctor account');
    }
    
    return response.data;
  } catch (error) {
    console.error('Invitation validation error:', error);
    const message = error.response?.data?.detail || error.message || 'Invalid or expired invitation';
    throw new Error(message);
  }
};

/**
 * Register new doctor account
 * @param {Object} doctorData - Doctor registration data
 * @param {string} doctorData.invite_token - Invitation token
 * @param {string} doctorData.fname - First name
 * @param {string} doctorData.lname - Last name
 * @param {string} doctorData.mname - Middle name (optional)
 * @param {string} doctorData.email - Email address
 * @param {string} doctorData.phone - Phone number
 * @param {string} doctorData.licenseNumber - Medical license number
 * @param {string} doctorData.password - Password
 * @param {Array<string>} doctorData.specialization - Array of specializations
 * @param {string} doctorData.otherSpecialization - Custom specialization if "Other" selected
 * @returns {Promise<Object>} Registration response
 */
export const registerDoctor = async (doctorData) => {
  try {
    const response = await BaseAPI.post('/auth/doctor-signup', {
      invite_token: doctorData.invite_token,
      fname: doctorData.fname,
      lname: doctorData.lname,
      mname: doctorData.mname || null,
      email: doctorData.email,
      phone: doctorData.phone,
      licenseNumber: doctorData.licenseNumber,
      password: doctorData.password,
      specialization: doctorData.specialization,
      otherSpecialization: doctorData.otherSpecialization || null,
    });

    return response.data;
  } catch (error) {
    console.error('Doctor registration error:', error);
    const message = error.response?.data?.detail || error.message || 'Doctor registration failed';
    throw new Error(message);
  }
};