export interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address: string;
  state_id?: number;
  district_id?: number;
  block_id?: number;
  village?: string;
  pincode?: string;
  aadhaar?: string;
  pan_number?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  rh_factor?: 'Positive' | 'Negative' | 'Unknown';
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Separated';
  occupation?: string;
  religion?: string;
  category?: 'General' | 'SC' | 'ST' | 'OBC';
  medical_history?: string;
  surgical_history?: string;
  allergies?: string;
  current_medications?: string;
  family_history?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  is_active: boolean;
  state_name?: string;
  district_name?: string;
  block_name?: string;
}

export interface PatientVisit {
  visit_id: number;
  patient_id: number;
  hospital_id: number;
  visit_type: 'OPD' | 'IPD' | 'Emergency' | 'Follow-up' | 'Day Care';
  visit_date: string;
  visit_time?: string;
  chief_complaint: string;
  vitals?: any;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  attending_doctor_staff_id?: number;
  discharge_date?: string;
  discharge_summary?: string;
  status: 'Registered' | 'Vitals Taken' | 'Doctor Consultation' | 'Tests Ordered' | 'Admitted' | 'Discharged' | 'Referred' | 'Absconded';
  hospital_name?: string;
}