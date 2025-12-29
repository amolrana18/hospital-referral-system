const { pool } = require('../config/database');

class Ambulance {
  static async getAmbulances(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT a.*, h.name as hospital_name
      FROM ambulance_services a
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      WHERE a.hospital_id = ? AND a.is_active = TRUE
      ORDER BY a.vehicle_number
    `, [hospitalId]);
    return rows;
  }

  static async updateAmbulanceStatus(ambulanceId, status, location = null) {
    let query = 'UPDATE ambulance_services SET current_status = ?, last_location_update = CURRENT_TIMESTAMP';
    const params = [status];

    if (location) {
      query += ', gps_latitude = ?, gps_longitude = ?';
      params.push(location.latitude, location.longitude);
    }

    query += ' WHERE ambulance_id = ?';
    params.push(ambulanceId);

    const [result] = await pool.execute(query, params);
    return result.affectedRows > 0;
  }

  static async getAmbulanceStatus() {
    const [rows] = await pool.execute(`
      SELECT 
        a.ambulance_id,
        a.vehicle_number,
        a.ambulance_type,
        a.current_status,
        h.name as stationed_hospital,
        CONCAT(u.first_name, ' ', u.last_name) as driver_name,
        u.phone as driver_phone,
        a.gps_latitude,
        a.gps_longitude,
        a.last_location_update,
        TIMESTAMPDIFF(MINUTE, a.last_location_update, NOW()) as minutes_since_last_update
      FROM ambulance_services a
      LEFT JOIN hospitals h ON a.hospital_id = h.hospital_id
      LEFT JOIN hospital_staff hs ON a.driver_staff_id = hs.staff_id
      LEFT JOIN users u ON hs.user_id = u.user_id
      WHERE a.is_active = TRUE
      ORDER BY a.current_status, a.vehicle_number
    `);
    return rows;
  }
}

module.exports = Ambulance;