const { pool } = require('../config/database');
const { generateReferralCode } = require('../utils/generateCode');

class Referral {
  static async create(referralData) {
    // Helper function to convert undefined to null
    const toNull = (value) => value === undefined ? null : value;
    
    const patient_id = referralData.patient_id;
    const referring_hospital_id = referralData.referring_hospital_id;
    const referring_staff_id = toNull(referralData.referring_staff_id);
    const receiving_hospital_id = referralData.receiving_hospital_id;
    const reason_for_referral = referralData.reason_for_referral || '';
    const clinical_summary = toNull(referralData.clinical_summary);
    const priority = referralData.priority || 'Routine';
    const bed_required = toNull(referralData.bed_required);
    const doctor_required = toNull(referralData.doctor_required);
    const ambulance_required = toNull(referralData.ambulance_required);
    const attached_report_ids = toNull(referralData.attached_report_ids);

    const referral_code = generateReferralCode();

    console.log('Creating referral with processed data:', {
      referral_code,
      patient_id,
      referring_hospital_id,
      referring_staff_id,
      receiving_hospital_id,
      reason_for_referral,
      clinical_summary,
      priority,
      bed_required,
      doctor_required,
      ambulance_required,
      attached_report_ids
    });

    const [result] = await pool.execute(`
      INSERT INTO referrals 
      (referral_code, patient_id, referring_hospital_id, referring_staff_id,
       receiving_hospital_id, reason_for_referral, clinical_summary,
       priority, bed_required, doctor_required, ambulance_required,
       attached_report_ids, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted')
    `, [
      referral_code, patient_id, referring_hospital_id, referring_staff_id,
      receiving_hospital_id, reason_for_referral, clinical_summary,
      priority, bed_required, doctor_required, ambulance_required,
      attached_report_ids
    ]);

    return { id: result.insertId, referral_code };
  }

  static async findById(referralId) {
    try {
      const [rows] = await pool.execute(`
        SELECT r.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               p.phone_number as patient_phone, p.blood_group, p.date_of_birth,
               p.gender, p.address, p.medical_history, p.allergies, p.current_medications,
               p.emergency_contact_name, p.emergency_contact_number, p.aadhaar,
               rh.name as referring_hospital_name,
               eh.name as receiving_hospital_name,
               CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) as referring_doctor_name
        FROM referrals r
        JOIN patients p ON r.patient_id = p.patient_id
        JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
        JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
        LEFT JOIN hospital_staff hs ON r.referring_staff_id = hs.staff_id
        LEFT JOIN users s ON hs.user_id = s.user_id
        WHERE r.referral_id = ?
      `, [referralId]);
      return rows[0];
    } catch (error) {
      console.error('Error in Referral.findById:', error);
      throw error;
    }
  }

  static async findByHospital(hospitalId, userRole) {
    let query = `
      SELECT r.*, 
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             rh.name as referring_hospital_name,
             eh.name as receiving_hospital_name,
             r.priority, r.status, r.referral_date
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
      JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
      WHERE 1=1
    `;

    const params = [];

    if (userRole === 'Hospital Admin') {
      query += ' AND r.receiving_hospital_id = ?';
      params.push(hospitalId);
    } else if (userRole === 'Doctor' || userRole === 'Nurse') {
      query += ' AND r.referring_hospital_id = ?';
      params.push(hospitalId);
    }

    query += ' ORDER BY r.referral_date DESC';

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  static async updateStatus(referralId, status, updateData = {}) {
    const { review_notes, approved_by_staff_id } = updateData;
    
    const [result] = await pool.execute(`
      UPDATE referrals 
      SET status = ?, review_notes = ?, approved_by_staff_id = ?, 
          approval_date = CURRENT_TIMESTAMP
      WHERE referral_id = ?
    `, [status, review_notes, approved_by_staff_id, referralId]);

    return result.affectedRows > 0;
  }

  static async getDashboardStats() {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN priority = 'Emergency' THEN 1 END) as emergency,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical
      FROM referrals
    `);
    return rows[0];
  }

  static async getReferralTimeline(referralId) {
    const [rows] = await pool.execute(`
      SELECT 
        'Created' as event,
        referral_date as date,
        'Referral created' as description
      FROM referrals 
      WHERE referral_id = ?
      
      UNION ALL
      
      SELECT 
        'Status Update' as event,
        updated_at as date,
        CONCAT('Status changed to ', status) as description
      FROM referrals 
      WHERE referral_id = ? AND status != 'Submitted'
      
      ORDER BY date
    `, [referralId, referralId]);
    return rows;
  }
}

module.exports = Referral;