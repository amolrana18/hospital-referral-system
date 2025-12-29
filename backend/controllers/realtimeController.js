const { pool } = require('../config/database');
const { getIO } = require('../utils/socketManager');

// @desc    Get real-time hospital resources
// @route   GET /api/realtime/hospital-resources
// @access  Private (Super Admin)
const getHospitalResources = async (req, res) => {
  try {
    const [hospitals] = await pool.execute(`
      SELECT 
        h.hospital_id,
        h.name as hospital_name,
        h.type,
        h.category,
        d.name as district_name,
        h.total_beds,
        COUNT(CASE WHEN b.status = 'Available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN b.status = 'Available' AND b.bed_type = 'ICU' THEN 1 END) as available_icu_beds,
        h.phone,
        h.latitude,
        h.longitude,
        ROUND((COUNT(CASE WHEN b.status = 'Occupied' THEN 1 END) * 100.0 / NULLIF(COUNT(b.bed_id), 0)), 2) as occupancy_rate
      FROM hospitals h
      JOIN districts d ON h.district_id = d.district_id
      LEFT JOIN beds b ON h.hospital_id = b.hospital_id
      WHERE h.is_active = TRUE
      GROUP BY h.hospital_id
      ORDER BY h.name
    `);

    res.json({ success: true, data: hospitals });
  } catch (error) {
    console.error('Get hospital resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get real-time bed status
// @route   GET /api/realtime/bed-status
// @access  Private
const getBedStatus = async (req, res) => {
  try {
    let query = `
      SELECT 
        h.hospital_id,
        h.name as hospital_name,
        d.name as district_name,
        COUNT(b.bed_id) as total_beds,
        SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available_beds,
        SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
        SUM(CASE WHEN b.bed_type = 'ICU' AND b.status = 'Available' THEN 1 ELSE 0 END) as available_icu_beds,
        SUM(CASE WHEN b.bed_type = 'ICU' THEN 1 ELSE 0 END) as total_icu_beds,
        ROUND((SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(b.bed_id), 0)), 2) as occupancy_rate
      FROM hospitals h
      JOIN districts d ON h.district_id = d.district_id
      LEFT JOIN beds b ON h.hospital_id = b.hospital_id
      WHERE h.is_active = TRUE
    `;

    const params = [];

    // Get staff details to check hospital_id
    if (req.user.user_role !== 'Super Admin') {
      const [staff] = await pool.execute(
        'SELECT hospital_id FROM hospital_staff WHERE user_id = ?',
        [req.user.user_id]
      );
      
      if (staff.length > 0) {
        query += ' AND h.hospital_id = ?';
        params.push(staff[0].hospital_id);
      }
    }

    query += ' GROUP BY h.hospital_id, h.name, d.name ORDER BY d.name, h.name';

    const [bedStatus] = await pool.execute(query, params);

    res.json({ success: true, data: bedStatus });
  } catch (error) {
    console.error('Get bed status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get ambulance status
// @route   GET /api/realtime/ambulance-status
// @access  Private
const getAmbulanceStatus = async (req, res) => {
  try {
    let query = `
      SELECT 
        a.ambulance_id,
        a.vehicle_number,
        a.vehicle_type,
        a.status,
        a.driver_name,
        a.driver_phone,
        a.current_location,
        h.name as hospital_name,
        d.name as district_name
      FROM ambulance_services a
      JOIN hospitals h ON a.hospital_id = h.hospital_id
      JOIN districts d ON h.district_id = d.district_id
      WHERE h.is_active = TRUE
    `;

    const params = [];

    // Filter by hospital for non-super admin users
    if (req.user.user_role !== 'Super Admin') {
      const [staff] = await pool.execute(
        'SELECT hospital_id FROM hospital_staff WHERE user_id = ?',
        [req.user.user_id]
      );
      
      if (staff.length > 0) {
        query += ' AND a.hospital_id = ?';
        params.push(staff[0].hospital_id);
      }
    }

    query += ' ORDER BY a.status, d.name';

    const [ambulances] = await pool.execute(query, params);

    res.json({ success: true, data: ambulances });
  } catch (error) {
    console.error('Get ambulance status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get real-time referral updates
// @route   GET /api/realtime/referral-updates
// @access  Private
const getReferralUpdates = async (req, res) => {
  try {
    let query = `
      SELECT 
        r.referral_id,
        r.referral_code,
        r.created_at as referral_date,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.phone_number as patient_phone,
        p.blood_group,
        h1.name as referring_hospital,
        d1.name as referring_district,
        h2.name as target_hospital,
        d2.name as target_district,
        r.priority,
        r.status,
        r.reason_for_referral
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals h1 ON r.referring_hospital_id = h1.hospital_id
      JOIN districts d1 ON h1.district_id = d1.district_id
      LEFT JOIN hospitals h2 ON r.target_hospital_id = h2.hospital_id
      LEFT JOIN districts d2 ON h2.district_id = d2.district_id
      WHERE 1=1
    `;

    const params = [];

    if (req.user.user_role !== 'Super Admin') {
      const [staff] = await pool.execute(
        'SELECT hospital_id FROM hospital_staff WHERE user_id = ?',
        [req.user.user_id]
      );
      
      if (staff.length > 0) {
        query += ' AND (r.referring_hospital_id = ? OR r.target_hospital_id = ?)';
        params.push(staff[0].hospital_id, staff[0].hospital_id);
      }
    }

    query += ' ORDER BY r.created_at DESC LIMIT 20';

    const [referrals] = await pool.execute(query, params);

    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Get referral updates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Emit real-time bed update
// @route   POST /api/realtime/emit-bed-update
// @access  Private
const emitBedUpdate = async (req, res) => {
  try {
    const { hospital_id, bed_data } = req.body;
    
    const io = getIO();
    io.to(`hospital:${hospital_id}`).emit('bed:updated', {
      hospital_id,
      bed_data,
      timestamp: new Date()
    });
    
    // Also emit to all super admins
    io.emit('hospital:updated', {
      hospital_id,
      type: 'bed_update',
      data: bed_data,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Bed update broadcasted' });
  } catch (error) {
    console.error('Emit bed update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Emit real-time referral update
// @route   POST /api/realtime/emit-referral-update
// @access  Private
const emitReferralUpdate = async (req, res) => {
  try {
    const { referral_id, referral_data } = req.body;
    
    const io = getIO();
    io.to(`referral:${referral_id}`).emit('referral:update', {
      referral_id,
      referral_data,
      timestamp: new Date()
    });
    
    // Emit to relevant hospitals
    if (referral_data.referring_hospital_id) {
      io.to(`hospital:${referral_data.referring_hospital_id}`).emit('referral:status', referral_data);
    }
    if (referral_data.target_hospital_id) {
      io.to(`hospital:${referral_data.target_hospital_id}`).emit('referral:status', referral_data);
    }

    res.json({ success: true, message: 'Referral update broadcasted' });
  } catch (error) {
    console.error('Emit referral update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHospitalResources,
  getBedStatus,
  getAmbulanceStatus,
  getReferralUpdates,
  emitBedUpdate,
  emitReferralUpdate
};