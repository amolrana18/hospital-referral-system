export interface Hospital {
  hospital_id: number;
  name: string;
  type: 'Government' | 'Private' | 'Charitable' | 'Trust' | 'Medical College' | 'AIIMS' | 'ESI' | 'Military';
  hospital_level: 'Primary Health Centre' | 'Community Health Centre' | 'Sub-District Hospital' | 'District Hospital' | 'Tertiary' | 'Super Specialty' | 'Medical College';
  state_id: number;
  district_id: number;
  block_id?: number;
  address: string;
  pincode: string;
  contact_number: string;
  emergency_number: string;
  email?: string;
  hospital_code: string;
  bed_capacity: number;
  operational_beds: number;
  icu_beds: number;
  ventilator_beds: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  established_year?: number;
  website?: string;
  state_name?: string;
  district_name?: string;
  block_name?: string;
}

export interface District {
  district_id: number;
  district_name: string;
  district_code?: string;
}

export interface Block {
  block_id: number;
  block_name: string;
  block_code?: string;
}

export interface BedUpdate {
  operational_beds: number;
  icu_beds: number;
  ventilator_beds: number;
}