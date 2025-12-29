const { pool } = require('../config/database');

class Staff {
  static async create(staffData) {
    const {
      user_id, hospital_id, employee_code, designation,
      department, specialization, qualifications, registration_number,
      experience_years, joining_date, contact_number
    } = staffData;

    const [result] = await pool.execute(`
      INSERT INTO hospital_staff 
      (user_id, hospital_id, employee_code, designation,
       department, specialization, qualifications, registration_number,
       experience_years, joining_date, contact_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, hospital_id, employee_code, designation,
      department, specialization, qualifications, registration_number,
      experience_years, joining_date, contact_number
    ]);

    return result.insertId;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.execute(`
      SELECT hs.*, h.name as hospital_name, u.user_role
      FROM hospital_staff hs
      JOIN users u ON hs.user_id = u.user_id
      JOIN hospitals h ON hs.hospital_id = h.hospital_id
      WHERE hs.user_id = ? AND hs.is_active = TRUE
    `, [userId]);
    return rows[0];
  }

  static async findByHospital(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT hs.*, u.first_name, u.last_name, u.email, u.phone
      FROM hospital_staff hs
      JOIN users u ON hs.user_id = u.user_id
      WHERE hs.hospital_id = ? AND hs.is_active = TRUE
      ORDER BY hs.designation
    `, [hospitalId]);
    return rows;
  }

  static async updateStatus(staffId, status) {
    const [result] = await pool.execute(`
      UPDATE hospital_staff 
      SET current_status = ?
      WHERE staff_id = ?
    `, [status, staffId]);
    return result.affectedRows > 0;
  }
}

module.exports = Staff;