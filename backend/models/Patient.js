const { pool } = require('../config/database');

class Patient {
  static async create(patientData) {
    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value) => {
      if (value === '' || value === undefined || value === null) {
        return null;
      }
      return value;
    };
    
    // Extract and set defaults for all fields
    const first_name = patientData.first_name;
    const last_name = patientData.last_name;
    const date_of_birth = toNullIfEmpty(patientData.date_of_birth);
    const gender = patientData.gender || 'Unknown';
    const phone_number = patientData.phone_number;
    const alternate_phone = toNullIfEmpty(patientData.alternate_phone);
    const email = toNullIfEmpty(patientData.email);
    const address = patientData.address || '';
    const state_id = patientData.state_id || 1;
    const district_id = toNullIfEmpty(patientData.district_id);
    const block_id = toNullIfEmpty(patientData.block_id);
    const village = toNullIfEmpty(patientData.village);
    const pincode = toNullIfEmpty(patientData.pincode);
    const aadhaar = toNullIfEmpty(patientData.aadhaar);
    const pan_number = toNullIfEmpty(patientData.pan_number);
    const blood_group = patientData.blood_group || 'Unknown';
    const rh_factor = patientData.rh_factor || 'Unknown';
    const marital_status = toNullIfEmpty(patientData.marital_status);
    const occupation = toNullIfEmpty(patientData.occupation);
    const religion = toNullIfEmpty(patientData.religion);
    const category = toNullIfEmpty(patientData.category);
    const medical_history = toNullIfEmpty(patientData.medical_history);
    const surgical_history = toNullIfEmpty(patientData.surgical_history);
    const allergies = toNullIfEmpty(patientData.allergies);
    const current_medications = toNullIfEmpty(patientData.current_medications);
    const family_history = toNullIfEmpty(patientData.family_history);
    const emergency_contact_name = toNullIfEmpty(patientData.emergency_contact_name);
    const emergency_contact_number = toNullIfEmpty(patientData.emergency_contact_number);
    const emergency_contact_relationship = toNullIfEmpty(patientData.emergency_contact_relationship);

    const [result] = await pool.execute(`
      INSERT INTO patients 
      (first_name, last_name, date_of_birth, gender, phone_number, alternate_phone,
       email, address, state_id, district_id, block_id, village, pincode,
       aadhaar, pan_number, blood_group, rh_factor, marital_status, occupation,
       religion, category, medical_history, surgical_history, allergies,
       current_medications, family_history, emergency_contact_name, 
       emergency_contact_number, emergency_contact_relationship, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      first_name, last_name, date_of_birth, gender, phone_number, alternate_phone,
      email, address, state_id, district_id, block_id, village, pincode,
      aadhaar, pan_number, blood_group, rh_factor, marital_status, occupation,
      religion, category, medical_history, surgical_history, allergies,
      current_medications, family_history, emergency_contact_name, 
      emergency_contact_number, emergency_contact_relationship
    ]);

    return result.insertId;
  }

  static async findById(patientId) {
    const [rows] = await pool.execute(`
      SELECT p.*, s.state_name, d.district_name, b.block_name
      FROM patients p
      LEFT JOIN states s ON p.state_id = s.state_id
      LEFT JOIN districts d ON p.district_id = d.district_id
      LEFT JOIN blocks b ON p.block_id = b.block_id
      WHERE p.patient_id = ?
    `, [patientId]);
    return rows[0];
  }

  static async search(searchTerm) {
    const [rows] = await pool.execute(`
      SELECT patient_id, first_name, last_name, phone_number, aadhaar, blood_group, 
             date_of_birth, gender, address, village, district_name, block_name
      FROM patients p
      LEFT JOIN districts d ON p.district_id = d.district_id
      LEFT JOIN blocks b ON p.block_id = b.block_id
      WHERE first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ? OR aadhaar LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `, [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]);
    return rows;
  }

  static async getRecentPatients() {
    const [rows] = await pool.execute(`
      SELECT patient_id, first_name, last_name, phone_number, aadhaar, blood_group,
             date_of_birth, gender, address, village, district_name, block_name
      FROM patients p
      LEFT JOIN districts d ON p.district_id = d.district_id
      LEFT JOIN blocks b ON p.block_id = b.block_id
      WHERE is_active = TRUE
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    return rows;
  }

  static async getPatientVisits(patientId) {
    const [rows] = await pool.execute(`
      SELECT v.*, h.name as hospital_name
      FROM patient_visits v
      JOIN hospitals h ON v.hospital_id = h.hospital_id
      WHERE v.patient_id = ?
      ORDER BY v.visit_date DESC
    `, [patientId]);
    return rows;
  }
}

module.exports = Patient;