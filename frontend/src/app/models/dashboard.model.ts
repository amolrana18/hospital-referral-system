export interface DashboardStats {
  total_hospitals: number;
  total_beds: number;
  available_beds: number;
  total_icu_beds: number;
  total_ventilators: number;
}

export interface ReferralDashboardStats {
  total: number;
  submitted: number;
  approved: number;
  completed: number;
  rejected: number;
  emergency: number;
  critical: number;
}

export interface BedStatus {
  hospital_id: number;
  hospital_name: string;
  district_name: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  available_icu_beds: number;
  total_icu_beds: number;
  occupancy_rate: number;
}

export interface DistrictStat {
  district_name: string;
  hospital_count: number;
}

export interface HospitalStat {
  hospital_name: string;
  district_name: string;
  bed_capacity: number;
  available_beds: number;
  available_icu: number;
  occupancy_rate: number;
}