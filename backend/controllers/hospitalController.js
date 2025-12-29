const Hospital = require('../models/Hospital');
const { pool } = require('../config/database');

// @desc    Get all hospitals
// @route   GET /api/hospitals
// @access  Private (Super Admin, Hospital Admin)
const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.findAll();
    res.json({ success: true, data: hospitals });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single hospital
// @route   GET /api/hospitals/:id
// @access  Private
const getHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create hospital
// @route   POST /api/hospitals
// @access  Private (Super Admin only)
const createHospital = async (req, res) => {
  try {
    // Generate hospital code
    const hospitalCode = `HOSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const hospitalData = {
      ...req.body,
      hospital_code: hospitalCode,
      is_active: true
    };

    const hospitalId = await Hospital.create(hospitalData);
    
    // Get created hospital
    const hospital = await Hospital.findById(hospitalId);

    // Emit real-time update (if socket is available)
    if (req.io) {
      req.io.emit('hospital:created', hospital);
    }

    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital
    });
  } catch (error) {
    console.error('Create hospital error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create hospital', 
      error: error.message 
    });
  }
};

// @desc    Update hospital
// @route   PUT /api/hospitals/:id
// @access  Private (Super Admin, Hospital Admin of that hospital)
const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check authorization (Hospital Admin can only update their hospital)
    if (req.user.user_role === 'Hospital Admin' && 
        req.user.hospital_id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to update this hospital' });
    }

    const updated = await Hospital.update(req.params.id, req.body);
    
    if (!updated) {
      return res.status(400).json({ message: 'Hospital update failed' });
    }

    const updatedHospital = await Hospital.findById(req.params.id);

    // Emit real-time update
    req.io.emit('hospital:updated', updatedHospital);

    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: updatedHospital
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update bed availability
// @route   PUT /api/hospitals/:id/beds
// @access  Private (Hospital Admin, Super Admin)
const updateBedAvailability = async (req, res) => {
  try {
    const { operational_beds, icu_beds, ventilator_beds } = req.body;

    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Check authorization
    if (req.user.user_role === 'Hospital Admin' && 
        req.user.hospital_id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized to update this hospital' });
    }

    // Validate bed counts
    if (operational_beds > hospital.bed_capacity) {
      return res.status(400).json({ 
        message: `Operational beds cannot exceed total capacity (${hospital.bed_capacity})` 
      });
    }

    const updated = await Hospital.updateBedAvailability(req.params.id, {
      operational_beds,
      icu_beds,
      ventilator_beds
    });

    if (!updated) {
      return res.status(400).json({ message: 'Bed availability update failed' });
    }

    const updatedHospital = await Hospital.findById(req.params.id);

    // Emit real-time update
    req.io.emit('bed:updated', {
      hospital_id: req.params.id,
      operational_beds,
      icu_beds,
      ventilator_beds,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Bed availability updated successfully',
      data: updatedHospital
    });
  } catch (error) {
    console.error('Update bed availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get hospital resources
// @route   GET /api/hospitals/:id/resources
// @access  Private
const getHospitalResources = async (req, res) => {
  try {
    const resources = await Hospital.getHospitalResources(req.params.id);
    
    if (!resources) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    res.json({ success: true, data: resources });
  } catch (error) {
    console.error('Get hospital resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get districts
// @route   GET /api/hospitals/districts
// @access  Public
const getDistricts = async (req, res) => {
  try {
    const districts = await Hospital.getDistricts();
    res.json({ success: true, data: districts });
  } catch (error) {
    console.error('Get districts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get blocks by district
// @route   GET /api/hospitals/districts/:districtId/blocks
// @access  Public
const getBlocksByDistrict = async (req, res) => {
  try {
    const blocks = await Hospital.getBlocksByDistrict(req.params.districtId);
    res.json({ success: true, data: blocks });
  } catch (error) {
    console.error('Get blocks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get states
// @route   GET /api/hospitals/states
// @access  Public
const getStates = async (req, res) => {
  try {
    const states = await Hospital.getStates();
    res.json({ success: true, data: states });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get hospital staff
// @route   GET /api/hospitals/:id/staff
// @access  Private (Hospital Admin, Super Admin)
const getHospitalStaff = async (req, res) => {
  try {
    const [staff] = await pool.execute(`
      SELECT hs.*, u.first_name, u.last_name, u.email, u.phone,
             COALESCE(hs.current_status, 'Off-Duty') as current_status
      FROM hospital_staff hs
      JOIN users u ON hs.user_id = u.user_id
      WHERE hs.hospital_id = ? AND hs.is_active = TRUE
      ORDER BY hs.designation
    `, [req.params.id]);

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get hospital staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add hospital staff
// @route   POST /api/hospitals/staff
// @access  Private (Super Admin, Hospital Admin)
const addHospitalStaff = async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, phone, date_of_birth, gender, user_role,
      hospital_id, designation, department, specialization, qualifications, 
      registration_number, experience_years, contact_number
    } = req.body;

    // Create user first
    const User = require('../models/User');
    const userId = await User.create({
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      date_of_birth, 
      gender, 
      user_role
    });

    // Create staff record
    const Staff = require('../models/Staff');
    const employeeCode = `EMP${hospital_id}${Date.now().toString().slice(-4)}`;
    
    await Staff.create({
      user_id: userId,
      hospital_id,
      employee_code: employeeCode,
      designation,
      department,
      specialization,
      qualifications,
      registration_number,
      experience_years: experience_years || 0,
      joining_date: new Date().toISOString().split('T')[0],
      contact_number: contact_number || phone
    });

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully'
    });
  } catch (error) {
    console.error('Add hospital staff error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/hospitals/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const stats = await Hospital.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  updateBedAvailability,
  getHospitalResources,
  getDistricts,
  getBlocksByDistrict,
  getStates,
  getHospitalStaff,
  addHospitalStaff,
  getDashboardStats
};