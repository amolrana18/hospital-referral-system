const { pool } = require('./config/database');

async function fixReferralsSchema() {
  try {
    console.log('Fixing referrals table schema...');
    
    // Drop dependent tables first
    console.log('Dropping dependent tables...');
    await pool.execute('DROP TABLE IF EXISTS referral_tracking');
    await pool.execute('DROP TABLE IF EXISTS medical_reports');
    await pool.execute('DROP TABLE IF EXISTS treatment_updates');
    await pool.execute('DROP TABLE IF EXISTS referrals');
    
    // Create referrals table with correct schema
    console.log('Creating referrals table...');
    await pool.execute(`
      CREATE TABLE referrals (
        referral_id INT PRIMARY KEY AUTO_INCREMENT,
        referral_code VARCHAR(20) UNIQUE NOT NULL,
        patient_id INT NOT NULL,
        referring_hospital_id INT NOT NULL,
        referring_staff_id INT NULL,
        receiving_hospital_id INT NOT NULL,
        reason_for_referral TEXT NOT NULL,
        clinical_summary TEXT,
        priority ENUM('Normal', 'Urgent', 'Emergency', 'Critical', 'Routine') DEFAULT 'Normal',
        bed_required BOOLEAN DEFAULT FALSE,
        doctor_required BOOLEAN DEFAULT FALSE,
        ambulance_required BOOLEAN DEFAULT FALSE,
        bed_type_required VARCHAR(50),
        doctor_specialization_required VARCHAR(100),
        ambulance_type_required VARCHAR(50),
        attached_report_ids TEXT,
        status ENUM('Created', 'Submitted', 'Pending', 'Approved', 'Rejected', 'In Transit', 'Completed', 'Cancelled') DEFAULT 'Submitted',
        review_notes TEXT,
        approved_by_staff_id INT NULL,
        approval_date TIMESTAMP NULL,
        referral_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
        FOREIGN KEY (referring_hospital_id) REFERENCES hospitals(hospital_id),
        FOREIGN KEY (referring_staff_id) REFERENCES hospital_staff(staff_id),
        FOREIGN KEY (receiving_hospital_id) REFERENCES hospitals(hospital_id),
        FOREIGN KEY (approved_by_staff_id) REFERENCES hospital_staff(staff_id),
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_referring_hospital (referring_hospital_id),
        INDEX idx_receiving_hospital (receiving_hospital_id),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // Create medical_reports table
    console.log('Creating medical_reports table...');
    await pool.execute(`
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
      )
    `);
    
    // Create referral_tracking table
    console.log('Creating referral_tracking table...');
    await pool.execute(`
      CREATE TABLE referral_tracking (
        tracking_id INT PRIMARY KEY AUTO_INCREMENT,
        referral_id INT NOT NULL,
        status ENUM('Created', 'Submitted', 'Pending', 'Approved', 'Rejected', 'In Transit', 'Completed', 'Cancelled') NOT NULL,
        notes TEXT,
        location VARCHAR(255),
        updated_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referral_id) REFERENCES referrals(referral_id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(user_id),
        INDEX idx_referral (referral_id),
        INDEX idx_status (status)
      )
    `);
    
    // Create treatment_updates table
    console.log('Creating treatment_updates table...');
    await pool.execute(`
      CREATE TABLE treatment_updates (
        update_id INT PRIMARY KEY AUTO_INCREMENT,
        referral_id INT NOT NULL,
        staff_id INT NOT NULL,
        update_type VARCHAR(50),
        update_notes TEXT,
        update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referral_id) REFERENCES referrals(referral_id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES hospital_staff(staff_id),
        INDEX idx_referral (referral_id)
      )
    `);
    
    console.log('Successfully fixed referrals table schema!');
    
  } catch (error) {
    console.error('Error fixing referrals schema:', error);
  } finally {
    process.exit();
  }
}

fixReferralsSchema();