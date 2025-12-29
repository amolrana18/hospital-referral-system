export interface Staff {
  staff_id: number;
  user_id: number;
  hospital_id: number;
  msu_id?: number;
  employee_code: string;
  designation: 'Chief Medical Officer' | 'Medical Superintendent' | 'Senior Doctor' | 'Junior Doctor' | 'Resident Doctor' | 'Consultant' | 'Head Nurse' | 'Staff Nurse' | 'Lab Technician' | 'Pharmacist' | 'Radiologist' | 'Hospital Administrator' | 'Ambulance Driver' | 'Paramedic' | 'Physiotherapist' | 'Nutritionist' | 'Social Worker' | 'Data Entry Operator' | 'Security' | 'Housekeeping' | 'Maintenance' | 'Billing Staff' | 'Receptionist' | 'Ward Boy' | 'Ward Girl';
  department?: string;
  specialization?: string;
  qualifications?: string;
  registration_number?: string;
  experience_years: number;
  joining_date: string;
  leaving_date?: string;
  is_active: boolean;
  current_status: 'On-Duty' | 'Off-Duty' | 'On-Leave' | 'On-Call' | 'Break' | 'Emergency Duty';
  contact_number?: string;
  alternate_contact_number?: string;
  emergency_contact?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  hospital_name?: string;
}