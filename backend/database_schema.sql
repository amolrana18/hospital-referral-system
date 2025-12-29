-- Hospital Referral & Real-Time Resource Management System Database Schema
-- For Uttarakhand State

CREATE DATABASE IF NOT EXISTS hospital_referral_system;
USE hospital_referral_system;

-- States table (for Uttarakhand)
CREATE TABLE states (
    state_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts table (Uttarakhand districts)
CREATE TABLE districts (
    district_id INT PRIMARY KEY AUTO_INCREMENT,
    state_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(state_id)
);

-- Blocks table (Sub-districts/Tehsils)
CREATE TABLE blocks (
    block_id INT PRIMARY KEY AUTO_INCREMENT,
    district_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts(district_id)
);

-- Roles table
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (Email-based authentication)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    user_role ENUM('Super Admin', 'Hospital Admin', 'Doctor', 'Nurse', 'Staff') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (user_role)
);

-- Hospitals table
CREATE TABLE hospitals (
    hospital_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    type ENUM('Government', 'Private', 'Trust', 'Corporate') NOT NULL,
    category ENUM('Primary', 'Secondary', 'Tertiary', 'Super Specialty') NOT NULL,
    address TEXT NOT NULL,
    state_id INT NOT NULL,
    district_id INT NOT NULL,
    block_id INT,
    pincode VARCHAR(10),
    phone VARCHAR(15),
    email VARCHAR(255),
    website VARCHAR(255),
    established_year YEAR,
    total_beds INT DEFAULT 0,
    icu_beds INT DEFAULT 0,
    emergency_beds INT DEFAULT 0,
    operation_theaters INT DEFAULT 0,
    ambulance_count INT DEFAULT 0,
    specializations JSON,
    facilities JSON,
    is_active BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(state_id),
    FOREIGN KEY (district_id) REFERENCES districts(district_id),
    FOREIGN KEY (block_id) REFERENCES blocks(block_id),
    INDEX idx_district (district_id),
    INDEX idx_active (is_active)
);

-- Hospital Staff table
CREATE TABLE hospital_staff (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    hospital_id INT NOT NULL,
    employee_code VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    department VARCHAR(100),
    specialization VARCHAR(100),
    qualifications TEXT,
    registration_number VARCHAR(100),
    experience_years INT DEFAULT 0,
    joining_date DATE,
    contact_number VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id),
    INDEX idx_user (user_id)
);

-- Patients table
CREATE TABLE patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    phone_number VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    state_id INT,
    district_id INT,
    block_id INT,
    pincode VARCHAR(10),
    aadhaar VARCHAR(12) UNIQUE,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(15),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    insurance_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (state_id) REFERENCES states(state_id),
    FOREIGN KEY (district_id) REFERENCES districts(district_id),
    FOREIGN KEY (block_id) REFERENCES blocks(block_id),
    INDEX idx_phone (phone_number),
    INDEX idx_aadhaar (aadhaar)
);

-- Bed Availability table
CREATE TABLE beds (
    bed_id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    bed_type ENUM('General', 'ICU', 'NICU', 'PICU', 'Emergency', 'Maternity', 'Isolation') NOT NULL,
    ward_name VARCHAR(100),
    floor_number INT,
    status ENUM('Available', 'Occupied', 'Under Maintenance', 'Reserved') DEFAULT 'Available',
    patient_id INT NULL,
    assigned_date TIMESTAMP NULL,
    discharge_date TIMESTAMP NULL,
    daily_rate DECIMAL(10, 2),
    equipment JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    UNIQUE KEY unique_bed (hospital_id, bed_number),
    INDEX idx_hospital_status (hospital_id, status),
    INDEX idx_bed_type (bed_type)
);

-- Referrals table
CREATE TABLE referrals (
    referral_id INT PRIMARY KEY AUTO_INCREMENT,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    referring_hospital_id INT NOT NULL,
    referring_doctor_id INT NOT NULL,
    target_hospital_id INT,
    target_doctor_id INT,
    diagnosis TEXT NOT NULL,
    reason_for_referral TEXT NOT NULL,
    priority ENUM('Normal', 'Urgent', 'Emergency') DEFAULT 'Normal',
    required_specialization VARCHAR(100),
    required_bed_type ENUM('General', 'ICU', 'NICU', 'PICU', 'Emergency', 'Maternity', 'Isolation'),
    medical_reports JSON,
    current_condition TEXT,
    vital_signs JSON,
    treatment_given TEXT,
    status ENUM('Created', 'Pending', 'Accepted', 'Rejected', 'In Transit', 'Completed', 'Cancelled') DEFAULT 'Created',
    created_by INT NOT NULL,
    accepted_by INT NULL,
    accepted_at TIMESTAMP NULL,
    estimated_arrival TIMESTAMP NULL,
    actual_arrival TIMESTAMP NULL,
    completion_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (referring_hospital_id) REFERENCES hospitals(hospital_id),
    FOREIGN KEY (referring_doctor_id) REFERENCES hospital_staff(staff_id),
    FOREIGN KEY (target_hospital_id) REFERENCES hospitals(hospital_id),
    FOREIGN KEY (target_doctor_id) REFERENCES hospital_staff(staff_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (accepted_by) REFERENCES users(user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_referring_hospital (referring_hospital_id),
    INDEX idx_target_hospital (target_hospital_id),
    INDEX idx_created_at (created_at)
);

-- Medical Reports table
CREATE TABLE medical_reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    referral_id INT NOT NULL,
    patient_id INT NOT NULL,
    report_type ENUM('Lab Report', 'X-Ray', 'CT Scan', 'MRI', 'ECG', 'Echo', 'Ultrasound', 'Other') NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size INT,
    file_type VARCHAR(50),
    report_date DATE,
    findings TEXT,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(referral_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id),
    INDEX idx_referral (referral_id),
    INDEX idx_patient (patient_id)
);

-- Ambulance Services table
CREATE TABLE ambulance_services (
    ambulance_id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type ENUM('Basic', 'Advanced', 'ICU', 'Neonatal') DEFAULT 'Basic',
    driver_name VARCHAR(100),
    driver_phone VARCHAR(15),
    driver_license VARCHAR(50),
    paramedic_name VARCHAR(100),
    paramedic_phone VARCHAR(15),
    equipment JSON,
    status ENUM('Available', 'On Duty', 'Maintenance', 'Out of Service') DEFAULT 'Available',
    current_location VARCHAR(255),
    gps_coordinates JSON,
    fuel_level INT DEFAULT 100,
    last_service_date DATE,
    next_service_date DATE,
    insurance_expiry DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    INDEX idx_hospital (hospital_id),
    INDEX idx_status (status)
);

-- Referral Tracking table
CREATE TABLE referral_tracking (
    tracking_id INT PRIMARY KEY AUTO_INCREMENT,
    referral_id INT NOT NULL,
    status ENUM('Created', 'Pending', 'Accepted', 'Rejected', 'In Transit', 'Completed', 'Cancelled') NOT NULL,
    notes TEXT,
    location VARCHAR(255),
    updated_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(referral_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    INDEX idx_referral (referral_id),
    INDEX idx_status (status)
);

-- System Logs table
CREATE TABLE system_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Insert Uttarakhand State
INSERT INTO states (name, code) VALUES ('Uttarakhand', 'UK');

-- Insert Uttarakhand Districts
INSERT INTO districts (state_id, name, code) VALUES 
(1, 'Almora', 'ALM'),
(1, 'Bageshwar', 'BAG'),
(1, 'Chamoli', 'CHM'),
(1, 'Champawat', 'CHP'),
(1, 'Dehradun', 'DDN'),
(1, 'Haridwar', 'HDW'),
(1, 'Nainital', 'NTL'),
(1, 'Pauri Garhwal', 'PGH'),
(1, 'Pithoragarh', 'PTG'),
(1, 'Rudraprayag', 'RDP'),
(1, 'Tehri Garhwal', 'THR'),
(1, 'Udham Singh Nagar', 'USN'),
(1, 'Uttarkashi', 'UTK');

-- Insert Default Roles
INSERT INTO roles (role_name, description, permissions) VALUES 
('Super Admin', 'Full system access', '["all"]'),
('Hospital Admin', 'Hospital management access', '["hospital_management", "staff_management", "bed_management", "referral_management"]'),
('Doctor', 'Medical professional access', '["patient_management", "referral_creation", "medical_reports"]'),
('Nurse', 'Nursing staff access', '["patient_care", "referral_support", "bed_updates"]'),
('Staff', 'General staff access', '["basic_operations"]');

-- Create indexes for better performance
CREATE INDEX idx_users_email_active ON users(email, is_active);
CREATE INDEX idx_hospitals_district_active ON hospitals(district_id, is_active);
CREATE INDEX idx_beds_hospital_type_status ON beds(hospital_id, bed_type, status);
CREATE INDEX idx_referrals_status_priority ON referrals(status, priority);
CREATE INDEX idx_referrals_hospitals ON referrals(referring_hospital_id, target_hospital_id);