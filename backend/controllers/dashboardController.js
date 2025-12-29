const { pool } = require('../config/database');

// @desc    Get super admin dashboard data
// @route   GET /api/dashboard/super-admin
// @access  Private (Super Admin only)
const getSuperAdminDashboard = async (req, res) => {
  try {
    // Get hospital statistics
    const [hospitalStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_hospitals,
        SUM(bed_capacity) as total_beds,
        SUM(operational_beds) as available_beds,
        SUM(icu_beds) as available_icu_beds,
        SUM(ventilator_beds) as available_ventilators
      FROM hospitals 
      WHERE is_active = TRUE
    `);

    // Get referral statistics
    const [referralStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'Submitted' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
        COUNT(CASE WHEN priority = 'Emergency' THEN 1 END) as emergency,
        COUNT(CASE WHEN priority = 'Critical' THEN 1 END) as critical
      FROM referrals
    `);

    // Get recent referrals
    const [recentReferrals] = await pool.execute(`
      SELECT r.*, 
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             rh.name as referring_hospital,
             eh.name as receiving_hospital
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
      JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
      ORDER BY r.referral_date DESC
      LIMIT 10
    `);

    // Get district-wise hospital count
    const [districtStats] = await pool.execute(`
      SELECT d.district_name, COUNT(h.hospital_id) as hospital_count
      FROM districts d
      LEFT JOIN hospitals h ON d.district_id = h.district_id AND h.is_active = TRUE
      WHERE d.state_id = (SELECT state_id FROM states WHERE state_name = 'Uttarakhand')
      GROUP BY d.district_id
      ORDER BY d.district_name
    `);

    // Get bed occupancy by hospital
    const [bedOccupancy] = await pool.execute(`
      SELECT 
        h.name as hospital_name,
        d.district_name,
        h.bed_capacity,
        h.operational_beds as available_beds,
        h.icu_beds as available_icu,
        ROUND((h.bed_capacity - h.operational_beds) * 100.0 / h.bed_capacity, 2) as occupancy_rate
      FROM hospitals h
      JOIN districts d ON h.district_id = d.district_id
      WHERE h.is_active = TRUE
      ORDER BY occupancy_rate DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        hospitalStats: hospitalStats[0],
        referralStats: referralStats[0],
        recentReferrals,
        districtStats,
        bedOccupancy
      }
    });
  } catch (error) {
    console.error('Get super admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get hospital admin dashboard data
// @route   GET /api/dashboard/hospital-admin
// @access  Private (Hospital Admin only)
const getHospitalAdminDashboard = async (req, res) => {
  try {
    const hospitalId = req.user.hospital_id;

    // Get hospital details
    const [hospital] = await pool.execute(`
      SELECT name, bed_capacity, operational_beds, icu_beds, ventilator_beds
      FROM hospitals 
      WHERE hospital_id = ?
    `, [hospitalId]);

    // Get bed statistics
    const [bedStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_beds,
        COUNT(CASE WHEN status = 'Available' THEN 1 END) as available,
        COUNT(CASE WHEN status = 'Occupied' THEN 1 END) as occupied,
        COUNT(CASE WHEN bed_type = 'ICU' AND status = 'Available' THEN 1 END) as available_icu
      FROM beds 
      WHERE hospital_id = ?
    `, [hospitalId]);

    // Get referral statistics for this hospital
    const [referralStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Submitted' AND receiving_hospital_id = ? THEN 1 END) as incoming_pending,
        COUNT(CASE WHEN status = 'Submitted' AND referring_hospital_id = ? THEN 1 END) as outgoing_pending,
        COUNT(CASE WHEN status = 'Approved' AND receiving_hospital_id = ? THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'Completed' AND receiving_hospital_id = ? THEN 1 END) as completed
      FROM referrals
    `, [hospitalId, hospitalId, hospitalId, hospitalId]);

    // Get staff count
    const [staffStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN current_status = 'On-Duty' THEN 1 END) as on_duty,
        COUNT(CASE WHEN designation LIKE '%Doctor%' THEN 1 END) as doctors,
        COUNT(CASE WHEN designation LIKE '%Nurse%' THEN 1 END) as nurses
      FROM hospital_staff 
      WHERE hospital_id = ? AND is_active = TRUE
    `, [hospitalId]);

    // Get recent referrals
    const [recentReferrals] = await pool.execute(`
      SELECT r.*, 
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             rh.name as referring_hospital,
             eh.name as receiving_hospital
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
      JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
      WHERE r.receiving_hospital_id = ? OR r.referring_hospital_id = ?
      ORDER BY r.referral_date DESC
      LIMIT 10
    `, [hospitalId, hospitalId]);

    res.json({
      success: true,
      data: {
        hospital: hospital[0],
        bedStats: bedStats[0],
        referralStats: referralStats[0],
        staffStats: staffStats[0],
        recentReferrals
      }
    });
  } catch (error) {
    console.error('Get hospital admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get doctor dashboard data
// @route   GET /api/dashboard/doctor
// @access  Private (Doctor only)
const getDoctorDashboard = async (req, res) => {
  try {
    const staffId = req.user.staff_id;
    const hospitalId = req.user.hospital_id;

    // Get doctor's referrals
    const [referrals] = await pool.execute(`
      SELECT r.*, 
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             p.phone_number,
             rh.name as referring_hospital,
             eh.name as receiving_hospital,
             r.status, r.priority, r.referral_date
      FROM referrals r
      JOIN patients p ON r.patient_id = p.patient_id
      JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
      JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
      WHERE r.referring_staff_id = ? OR r.receiving_hospital_id = ?
      ORDER BY r.referral_date DESC
      LIMIT 20
    `, [staffId, hospitalId]);

    // Get upcoming appointments
    const [appointments] = await pool.execute(`
      SELECT a.*, 
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             p.phone_number,
             a.appointment_date, a.start_time, a.status
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.doctor_staff_id = ? 
        AND a.appointment_date >= CURDATE()
        AND a.status IN ('Scheduled', 'Confirmed')
      ORDER BY a.appointment_date, a.start_time
      LIMIT 10
    `, [staffId]);

    // Get hospital bed availability
    const [bedAvailability] = await pool.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'Available' THEN 1 END) as available_beds,
        COUNT(CASE WHEN bed_type = 'ICU' AND status = 'Available' THEN 1 END) as available_icu
      FROM beds 
      WHERE hospital_id = ?
    `, [hospitalId]);

    res.json({
      success: true,
      data: {
        referrals,
        appointments,
        bedAvailability: bedAvailability[0]
      }
    });
  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSuperAdminDashboard,
  getHospitalAdminDashboard,
  getDoctorDashboard
};