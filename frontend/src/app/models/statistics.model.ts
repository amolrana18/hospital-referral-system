export interface HomeStatistics {
  totalHospitals: number;
  totalPatients: number;
  successfulReferrals: number;
  systemUptime: number;
}

export interface StatItem {
  icon: string;
  value: number;
  label: string;
  progressWidth: string;
}