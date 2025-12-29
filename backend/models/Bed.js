const { pool } = require('../config/database');

class Bed {
  static async getHospitalBeds(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT b.*, m.unit_name
      FROM beds b
      LEFT JOIN medical_service_units m ON b.msu_id = m.msu_id
      WHERE b.hospital_id = ?
      ORDER BY b.bed_type, b.bed_number
    `, [hospitalId]);
    return rows;
  }

  static async updateBedStatus(bedId, status) {
    const [result] = await pool.execute(`
      UPDATE beds 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE bed_id = ?
    `, [status, bedId]);
    return result.affectedRows > 0;
  }

  static async getBedAvailability(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT 
        bed_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'Occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN status = 'Maintenance' THEN 1 END) as maintenance
      FROM beds 
      WHERE hospital_id = ?
      GROUP BY bed_type
    `, [hospitalId]);
    return rows;
  }
}

module.exports = Bed;