export interface User {
  id: number;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role: string;
  phone?: string;
  hospital_id?: number;
  hospitalName?: string;
  hospital_name?: string; // Backend compatibility
  staffId?: number;
  patientId?: number;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  user_role: string;
  hospital_id?: number;
  employee_code?: string;
  designation?: string;
  department?: string;
  specialization?: string;
  registration_number?: string;
  experience_years?: number;
  joining_date?: string;
}