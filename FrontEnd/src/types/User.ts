export interface MedicalProfile {
  id: number;
  user_id: number;
  medical_uid: string; 
  
  blood_type?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  philhealth_number?: string;
  pwd_id_number?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  
  updated_at?: string;
}