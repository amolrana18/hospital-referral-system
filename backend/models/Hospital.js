const { pool } = require('../config/database');

class Hospital {
  static async findAll() {
    const [rows] = await pool.execute(`
      SELECT h.*, s.state_name, d.district_name, b.block_name
      FROM hospitals h
      JOIN states s ON h.state_id = s.state_id
      JOIN districts d ON h.district_id = d.district_id
      LEFT JOIN blocks b ON h.block_id = b.block_id
      WHERE h.is_active = TRUE
      ORDER BY h.name
    `);
    return rows;
  }

  static async findById(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT h.*, s.state_name, d.district_name, b.block_name
      FROM hospitals h
      JOIN states s ON h.state_id = s.state_id
      JOIN districts d ON h.district_id = d.district_id
      LEFT JOIN blocks b ON h.block_id = b.block_id
      WHERE h.hospital_id = ? AND h.is_active = TRUE
    `, [hospitalId]);
    return rows[0];
  }

  static async create(hospitalData) {
    try {
      console.log('Creating hospital with data:', hospitalData);
      
      const {
        name, type, hospital_level, state_id, district_id, block_id,
        address, pincode, contact_number, emergency_number, email,
        hospital_code, bed_capacity, operational_beds, icu_beds,
        ventilator_beds, latitude, longitude, established_year, website,
        is_active = true
      } = hospitalData;

      // Ensure numeric fields are properly handled
      const numericFields = {
        state_id: parseInt(state_id) || 1,
        district_id: parseInt(district_id),
        block_id: block_id ? parseInt(block_id) : null,
        bed_capacity: parseInt(bed_capacity) || 0,
        operational_beds: parseInt(operational_beds) || 0,
        icu_beds: parseInt(icu_beds) || 0,
        ventilator_beds: parseInt(ventilator_beds) || 0,
        established_year: established_year ? parseInt(established_year) : null
      };

      console.log('Processed numeric fields:', numericFields);

      const [result] = await pool.execute(`
        INSERT INTO hospitals 
        (name, type, hospital_level, state_id, district_id, block_id, 
         address, pincode, contact_number, emergency_number, email,
         hospital_code, bed_capacity, operational_beds, icu_beds,
         ventilator_beds, latitude, longitude, established_year, website, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, type, hospital_level, 
        numericFields.state_id, numericFields.district_id, numericFields.block_id,
        address, pincode, contact_number, emergency_number, email,
        hospital_code, 
        numericFields.bed_capacity, numericFields.operational_beds, 
        numericFields.icu_beds, numericFields.ventilator_beds,
        latitude, longitude, numericFields.established_year, website, is_active
      ]);

      console.log('Hospital created with ID:', result.insertId);
      return result.insertId;
    } catch (error) {
      console.error('Hospital create error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sql: error.sql
      });
      throw error;
    }
  }

  static async update(hospitalId, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return false;

    values.push(hospitalId);

    const query = `UPDATE hospitals SET ${fields.join(', ')} WHERE hospital_id = ?`;
    
    const [result] = await pool.execute(query, values);
    return result.affectedRows > 0;
  }

  static async updateBedAvailability(hospitalId, bedData) {
    const { operational_beds, icu_beds, ventilator_beds } = bedData;

    const [result] = await pool.execute(`
      UPDATE hospitals 
      SET operational_beds = ?, icu_beds = ?, ventilator_beds = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE hospital_id = ?
    `, [operational_beds, icu_beds, ventilator_beds, hospitalId]);

    return result.affectedRows > 0;
  }

  static async getHospitalResources(hospitalId) {
    const [rows] = await pool.execute(`
      SELECT 
        h.hospital_id, h.name, h.type, h.hospital_level,
        h.bed_capacity, h.operational_beds, h.icu_beds, h.ventilator_beds,
        COUNT(DISTINCT hs.staff_id) as staff_count,
        COUNT(CASE WHEN b.status = 'Available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.bed_type = 'ICU' AND b.status = 'Available' THEN 1 END) as available_icu_beds
      FROM hospitals h
      LEFT JOIN hospital_staff hs ON h.hospital_id = hs.hospital_id AND hs.is_active = TRUE
      LEFT JOIN beds b ON h.hospital_id = b.hospital_id
      WHERE h.hospital_id = ?
      GROUP BY h.hospital_id
    `, [hospitalId]);
    return rows[0];
  }

  static async getStates() {
    const [rows] = await pool.execute(`
      SELECT state_id, state_name 
      FROM states 
      ORDER BY state_name
    `);
    return rows;
  }

  static async getDistricts() {
    const [rows] = await pool.execute(`
      SELECT district_id, district_name 
      FROM districts 
      WHERE state_id = (SELECT state_id FROM states WHERE state_name = 'Uttarakhand')
      ORDER BY district_name
    `);
    return rows;
  }

  static async getBlocksByDistrict(districtId) {
    const [rows] = await pool.execute(`
      SELECT block_id, block_name 
      FROM blocks 
      WHERE district_id = ? AND is_active = TRUE
      ORDER BY block_name
    `, [districtId]);
    return rows;
  }

  static async getDashboardStats() {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(bed_capacity) as total_beds,
        SUM(operational_beds) as available_beds,
        SUM(icu_beds) as total_icu_beds,
        SUM(ventilator_beds) as total_ventilators
      FROM hospitals 
      WHERE is_active = TRUE
    `);
    
    const [referralStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_referrals,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved_referrals,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_referrals
      FROM referrals
    `);

    return {
      hospitals: stats[0],
      referrals: referralStats[0]
    };
  }
}

module.exports = Hospital;