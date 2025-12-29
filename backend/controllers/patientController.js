const Patient = require('../models/Patient');
const { pool } = require('../config/database');

// @desc    Create patient
// @route   POST /api/patients
// @access  Private (Doctor, Nurse, Hospital Admin)
const createPatient = async (req, res) => {
  try {
    const patientId = await Patient.create(req.body);

    const patient = await Patient.findById(patientId);

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('aadhaar')) {
        return res.status(400).json({ 
          success: false,
          message: 'A patient with this Aadhaar number already exists' 
        });
      }
      if (error.sqlMessage.includes('phone_number')) {
        return res.status(400).json({ 
          success: false,
          message: 'A patient with this phone number already exists' 
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get patient visits
    const visits = await Patient.getPatientVisits(req.params.id);

    res.json({ 
      success: true, 
      data: { 
        ...patient, 
        visits 
      } 
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private
const getAllPatients = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT patient_id, first_name, last_name, phone_number, aadhaar, blood_group,
             date_of_birth, gender, address, village, district_name, block_name
      FROM patients p
      LEFT JOIN districts d ON p.district_id = d.district_id
      LEFT JOIN blocks b ON p.block_id = b.block_id
      WHERE is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get all patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search patients
// @route   GET /api/patients/search
// @access  Private
const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    
    let patients;
    
    if (!q || q.length < 2) {
      // Return recent patients if no search query
      patients = await Patient.getRecentPatients();
    } else {
      patients = await Patient.search(q);
    }

    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create patient visit
// @route   POST /api/patients/:id/visits
// @access  Private (Doctor, Nurse)
const createPatientVisit = async (req, res) => {
  try {
    const {
      hospital_id,
      visit_type,
      chief_complaint,
      vitals,
      height_cm,
      weight_kg,
      bmi
    } = req.body;

    const patient = await Patient.findById(req.params.id);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const [result] = await pool.execute(`
      INSERT INTO patient_visits 
      (patient_id, hospital_id, visit_type, visit_date, visit_time,
       chief_complaint, vitals, height_cm, weight_kg, bmi,
       attending_doctor_staff_id, status)
      VALUES (?, ?, ?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, 'Registered')
    `, [
      req.params.id,
      hospital_id || req.user.hospital_id,
      visit_type,
      chief_complaint,
      vitals ? JSON.stringify(vitals) : null,
      height_cm,
      weight_kg,
      bmi,
      req.user.staff_id
    ]);

    res.status(201).json({
      success: true,
      message: 'Patient visit created successfully',
      data: { visit_id: result.insertId }
    });
  } catch (error) {
    console.error('Create patient visit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPatient,
  getPatient,
  getAllPatients,
  searchPatients,
  createPatientVisit
};