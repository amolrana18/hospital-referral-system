const Referral = require('../models/Referral');
const Patient = require('../models/Patient');
const Hospital = require('../models/Hospital');
const { pool } = require('../config/database');

// @desc    Create referral
// @route   POST /api/referrals
// @access  Private (Doctor, Nurse, Hospital Admin)
const createReferral = async (req, res) => {
  try {
    console.log('Create referral request:', {
      user: req.user,
      body: req.body
    });

    const {
      patient_id,
      receiving_hospital_id,
      reason_for_referral,
      clinical_summary,
      priority,
      bed_required,
      doctor_required,
      ambulance_required,
      attached_report_ids
    } = req.body;

    // Validate required fields
    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }
    if (!receiving_hospital_id) {
      return res.status(400).json({ message: 'Receiving hospital ID is required' });
    }
    if (!reason_for_referral) {
      return res.status(400).json({ message: 'Reason for referral is required' });
    }

    // Check if receiving hospital exists
    const receivingHospital = await Hospital.findById(receiving_hospital_id);
    if (!receivingHospital) {
      return res.status(404).json({ message: 'Receiving hospital not found' });
    }

    // Get referring hospital from user
    let referring_hospital_id;
    let referring_staff_id = null;

    if (req.user.user_role === 'Hospital Admin') {
      referring_hospital_id = req.user.hospital_id;
    } else {
      // For Doctor/Nurse, get hospital from staff record
      const [staff] = await pool.execute(
        'SELECT hospital_id, staff_id FROM hospital_staff WHERE user_id = ?',
        [req.user.user_id]
      );

      if (staff.length === 0) {
        return res.status(400).json({ message: 'Staff record not found for user' });
      }

      referring_hospital_id = staff[0].hospital_id;
      referring_staff_id = staff[0].staff_id;
    }

    if (!referring_hospital_id) {
      return res.status(400).json({ message: 'Unable to determine referring hospital' });
    }

    // Check if patient exists
    const patient = await Patient.findById(patient_id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const referralData = {
      patient_id,
      referring_hospital_id,
      referring_staff_id,
      receiving_hospital_id,
      reason_for_referral: reason_for_referral || '',
      clinical_summary: clinical_summary || null,
      priority: priority || 'Routine',
      bed_required: bed_required || false,
      doctor_required: doctor_required || false,
      ambulance_required: ambulance_required || false,
      attached_report_ids: attached_report_ids || null
    };

    console.log('Creating referral with data:', referralData);

    const result = await Referral.create(referralData);

    // Get created referral
    const referral = await Referral.findById(result.id);

    // Emit real-time alert to receiving hospital
    if (req.io) {
      req.io.to(`hospital:${receiving_hospital_id}`).emit('referral:alert', {
        referral_id: result.id,
        referral_code: result.referral_code,
        patient_name: `${referral.patient_first_name} ${referral.patient_last_name}`,
        referring_hospital: referral.referring_hospital_name,
        priority: referral.priority,
        reason: reason_for_referral,
        created_at: new Date()
      });

      // Also emit general referral created event for super admin dashboard
      req.io.emit('referral:created', {
        referral_id: result.id,
        referral_code: result.referral_code,
        patient_name: `${referral.patient_first_name} ${referral.patient_last_name}`,
        referring_hospital: referral.referring_hospital_name,
        receiving_hospital: referral.receiving_hospital_name,
        priority: referral.priority,
        status: 'Submitted',
        created_at: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Referral created successfully',
      data: referral
    });
  } catch (error) {
    console.error('Create referral error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// @desc    Get all referrals
// @route   GET /api/referrals
// @access  Private
const getReferrals = async (req, res) => {
  try {
    let referrals;
    
    if (req.user.user_role === 'Super Admin') {
      const [rows] = await pool.execute(`
        SELECT r.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               CONCAT(p.first_name, ' ', p.last_name) as patient_name,
               rh.name as referring_hospital_name,
               eh.name as receiving_hospital_name,
               r.priority, r.status, r.referral_date
        FROM referrals r
        JOIN patients p ON r.patient_id = p.patient_id
        JOIN hospitals rh ON r.referring_hospital_id = rh.hospital_id
        JOIN hospitals eh ON r.receiving_hospital_id = eh.hospital_id
        ORDER BY r.referral_date DESC
      `);
      referrals = rows;
    } else {
      // Handle case where hospital_id might be null
      if (!req.user.hospital_id) {
        return res.json({ success: true, data: [] });
      }
      
      referrals = await Referral.findByHospital(
        req.user.hospital_id, 
        req.user.user_role
      );
    }

    res.json({ success: true, data: referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single referral
// @route   GET /api/referrals/:id
// @access  Private
const getReferral = async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check authorization
    if (req.user.user_role === 'Hospital Admin' && 
        referral.receiving_hospital_id !== req.user.hospital_id) {
      return res.status(403).json({ message: 'Not authorized to view this referral' });
    }

    // Get timeline
    const timeline = await Referral.getReferralTimeline(req.params.id);

    res.json({ 
      success: true, 
      data: { 
        ...referral, 
        timeline 
      } 
    });
  } catch (error) {
    console.error('Get referral error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update referral status
// @route   PUT /api/referrals/:id/status
// @access  Private (Hospital Admin of receiving hospital)
const updateReferralStatus = async (req, res) => {
  try {
    const { status, review_notes } = req.body;

    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check authorization
    if (req.user.user_role === 'Hospital Admin' && 
        referral.receiving_hospital_id !== req.user.hospital_id) {
      return res.status(403).json({ message: 'Not authorized to update this referral' });
    }

    const updateData = {
      review_notes,
      approved_by_staff_id: req.user.staff_id
    };

    const updated = await Referral.updateStatus(req.params.id, status, updateData);
    
    if (!updated) {
      return res.status(400).json({ message: 'Status update failed' });
    }

    const updatedReferral = await Referral.findById(req.params.id);

    // Emit real-time update
    if (req.io) {
      req.io.emit('referral:status', {
        referral_id: req.params.id,
        status,
        updated_at: new Date(),
        reviewed_by: req.user.name
      });
    }

    res.json({
      success: true,
      message: `Referral ${status.toLowerCase()} successfully`,
      data: updatedReferral
    });
  } catch (error) {
    console.error('Update referral status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add treatment update
// @route   POST /api/referrals/:id/updates
// @access  Private (Doctor, Nurse at receiving hospital)
const addTreatmentUpdate = async (req, res) => {
  try {
    const { update_notes, update_type } = req.body;

    const referral = await Referral.findById(req.params.id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    // Check authorization
    if (req.user.hospital_id !== referral.receiving_hospital_id) {
      return res.status(403).json({ message: 'Not authorized to update this referral' });
    }

    // For now, just update the referral notes
    const [result] = await pool.execute(`
      UPDATE referrals 
      SET clinical_summary = CONCAT(IFNULL(clinical_summary, ''), '\n\nUpdate: ', ?)
      WHERE referral_id = ?
    `, [update_notes, req.params.id]);

    // Emit real-time update
    req.io.emit('referral:update', {
      referral_id: req.params.id,
      update_type,
      update_notes,
      updated_by: req.user.name,
      updated_at: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Treatment update added successfully'
    });
  } catch (error) {
    console.error('Add treatment update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get referral statistics
// @route   GET /api/referrals/stats
// @access  Private (Super Admin, Hospital Admin)
const getReferralStats = async (req, res) => {
  try {
    let stats;

    if (req.user.user_role === 'Super Admin') {
      // Use the same method as dashboard for consistency
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
      stats = rows[0];
    } else {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Submitted' AND receiving_hospital_id = ? THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'Submitted' AND referring_hospital_id = ? THEN 1 END) as outgoing_pending,
          COUNT(CASE WHEN status = 'Approved' AND receiving_hospital_id = ? THEN 1 END) as accepted,
          COUNT(CASE WHEN status = 'Completed' AND receiving_hospital_id = ? THEN 1 END) as completed,
          COUNT(CASE WHEN priority = 'Emergency' AND receiving_hospital_id = ? THEN 1 END) as emergency,
          COUNT(CASE WHEN priority = 'Critical' AND receiving_hospital_id = ? THEN 1 END) as critical
        FROM referrals
      `, [
        req.user.hospital_id, 
        req.user.hospital_id, 
        req.user.hospital_id,
        req.user.hospital_id,
        req.user.hospital_id,
        req.user.hospital_id
      ]);
      stats = rows[0];
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get referral timeline
// @route   GET /api/referrals/:id/timeline
// @access  Private
const getReferralTimeline = async (req, res) => {
  try {
    const timeline = await Referral.getReferralTimeline(req.params.id);
    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Get referral timeline error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createReferral,
  getReferrals,
  getReferral,
  getReferralTimeline,
  updateReferralStatus,
  addTreatmentUpdate,
  getReferralStats
};