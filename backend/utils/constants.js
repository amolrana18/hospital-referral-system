const USER_ROLES = {
  SUPER_ADMIN: 'Super Admin',
  HOSPITAL_ADMIN: 'Hospital Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  PATIENT: 'Patient',
  LAB_TECHNICIAN: 'Lab Technician',
  PHARMACIST: 'Pharmacist',
  AMBULANCE_DRIVER: 'Ambulance Driver'
};

const REFERRAL_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SCHEDULED: 'Scheduled',
  IN_TRANSIT: 'In Transit',
  ADMITTED: 'Admitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

const PRIORITY_LEVELS = {
  ROUTINE: 'Routine',
  URGENT: 'Urgent',
  EMERGENCY: 'Emergency',
  CRITICAL: 'Critical'
};

const BED_TYPES = {
  GENERAL: 'General',
  ICU: 'ICU',
  EMERGENCY: 'Emergency',
  PRIVATE: 'Private',
  ISOLATION: 'Isolation',
  PEDIATRIC: 'Pediatric',
  MATERNITY: 'Maternity'
};

const HOSPITAL_LEVELS = {
  PHC: 'Primary Health Centre',
  CHC: 'Community Health Centre',
  SDH: 'Sub-District Hospital',
  DH: 'District Hospital',
  TERTIARY: 'Tertiary',
  SUPER_SPECIALTY: 'Super Specialty',
  MEDICAL_COLLEGE: 'Medical College'
};

module.exports = {
  USER_ROLES,
  REFERRAL_STATUS,
  PRIORITY_LEVELS,
  BED_TYPES,
  HOSPITAL_LEVELS
};