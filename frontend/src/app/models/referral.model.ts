export interface Referral {
  referral_id: number;
  referral_code: string;
  patient_id: number;
  patient_visit_id?: number;
  referring_hospital_id: number;
  referring_staff_id?: number;
  referring_msu_id?: number;
  receiving_hospital_id: number;
  receiving_msu_id?: number;
  receiving_doctor_staff_id?: number;
  referral_date: string;
  priority: 'Routine' | 'Urgent' | 'Emergency' | 'Critical';
  reason_for_referral: string;
  clinical_summary?: string;
  examination_findings?: string;
  treatment_given?: string;
  bed_required: boolean;
  bed_type_required?: 'General' | 'ICU' | 'Emergency' | 'Private' | 'Isolation' | 'Pediatric' | 'Maternity';
  doctor_required: boolean;
  doctor_specialization_required?: string;
  equipment_required: boolean;
  equipment_list_required?: string;
  facility_required: boolean;
  facility_type_required?: string;
  blood_required: boolean;
  blood_group_required?: string;
  blood_units_required?: number;
  ambulance_required: boolean;
  ambulance_type_required?: string;
  attached_report_ids?: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Resource Checking' | 'Approved' | 'Rejected' | 'Scheduled' | 'In Transit' | 'Admitted' | 'Treatment Started' | 'Completed' | 'Cancelled' | 'Expired';
  bed_available?: boolean;
  doctor_available?: boolean;
  equipment_available?: boolean;
  facility_available?: boolean;
  blood_available?: boolean;
  ambulance_available?: boolean;
  assigned_bed_id?: number;
  assigned_doctor_staff_id?: number;
  assigned_equipment_ids?: string;
  assigned_facility_id?: number;
  assigned_blood_inventory_ids?: string;
  assigned_ambulance_id?: number;
  estimated_travel_time_minutes?: number;
  actual_travel_time_minutes?: number;
  distance_km?: number;
  reviewed_by_staff_id?: number;
  review_notes?: string;
  approved_by_staff_id?: number;
  approval_notes?: string;
  rejection_reason?: string;
  admission_date?: string;
  treatment_start_date?: string;
  discharge_date?: string;
  treatment_summary?: string;
  outcome?: 'Recovered' | 'Improved' | 'Transferred' | 'Referred' | 'Absconded' | 'Died' | 'Discharged Against Advice' | 'Treatment Ongoing';
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  patient_first_name?: string;
  patient_last_name?: string;
  patient_phone?: string;
  referring_hospital_name?: string;
  receiving_hospital_name?: string;
  referring_doctor_name?: string;
}

export interface TreatmentUpdate {
  update_id: number;
  referral_id: number;
  staff_id: number;
  update_type: string;
  update_notes: string;
  update_date: string;
  next_steps?: string;
  is_critical: boolean;
}

export interface ReferralStats {
  total: number;
  submitted: number;
  approved: number;
  completed: number;
  rejected: number;
  emergency: number;
  critical: number;
}