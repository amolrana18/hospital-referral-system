const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');
const { pool } = require('../config/database');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone, 
      user_role,
      hospital_id,
      employee_code,
      designation,
      department,
      specialization,
      qualifications,
      registration_number,
      experience_years,
      joining_date,
      date_of_birth,
      gender
    } = req.body;

    // Check if user exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const userId = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone,
      user_role
    });

    // If user is staff, create staff record
    let staffId = null;
    if (user_role !== 'Patient' && user_role !== 'Super Admin') {
      if (!hospital_id) {
        return res.status(400).json({ message: 'Hospital ID is required for staff' });
      }

      staffId = await Staff.create({
        user_id: userId,
        hospital_id,
        employee_code: employee_code || `EMP-${Date.now()}`,
        designation: (designation || 'Staff').substring(0, 50),
        department: (department || 'General').substring(0, 50),
        specialization: specialization ? specialization.substring(0, 100) : null,
        qualifications: qualifications ? qualifications.substring(0, 255) : null,
        registration_number: registration_number ? registration_number.substring(0, 50) : null,
        experience_years: experience_years || 0,
        joining_date: joining_date || new Date().toISOString().split('T')[0],
        contact_number: phone
      });
    }

    // Get user data
    const user = await User.findById(userId);
    
    res.status(201).json({
      success: true,
      token: generateToken(userId),
      user: {
        id: user.user_id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.user_role,
        hospital_id: hospital_id || null,
        staff_id: staffId
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check password
    const isPasswordMatch = await User.comparePassword(password, user.password_hash);
    
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get staff details if applicable
    let staffDetails = null;
    let hospitalId = null;
    let hospitalName = null;
    
    if (user.user_role !== 'Super Admin' && user.user_role !== 'Patient') {
      const [staff] = await pool.execute(`
        SELECT 
          hs.hospital_id,
          h.name as hospital_name,
          hs.staff_id
        FROM hospital_staff hs
        JOIN hospitals h ON hs.hospital_id = h.hospital_id
        WHERE hs.user_id = ?
      `, [user.user_id]);
      
      if (staff.length > 0) {
        staffDetails = staff[0];
        hospitalId = staff[0].hospital_id;
        hospitalName = staff[0].hospital_name;
      }
    }

    // For patients, get their details
    let patientDetails = null;
    if (user.user_role === 'Patient') {
      const [patients] = await pool.execute(
        'SELECT patient_id FROM patients WHERE email = ? OR phone_number = ? LIMIT 1',
        [email, email]
      );
      if (patients.length > 0) {
        patientDetails = patients[0];
      }
    }

    res.json({
      success: true,
      token: generateToken(user.user_id),
      user: {
        id: user.user_id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        fullName: `${user.first_name} ${user.last_name}`,
        role: user.user_role,
        hospital_id: hospitalId,
        hospitalName: hospitalName,
        staff_id: staffDetails ? staffDetails.staff_id : null,
        patient_id: patientDetails ? patientDetails.patient_id : null
      }
    });
    
    console.log('Login response:', {
      user_id: user.user_id,
      email: user.email,
      role: user.user_role,
      hospital_id: hospitalId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional details based on role
    let additionalDetails = {};
    
    if (user.user_role !== 'Super Admin' && user.user_role !== 'Patient') {
      const [staff] = await pool.execute(`
        SELECT 
          hs.hospital_id,
          h.name as hospital_name,
          hs.staff_id,
          hs.designation,
          hs.department
        FROM hospital_staff hs
        JOIN hospitals h ON hs.hospital_id = h.hospital_id
        WHERE hs.user_id = ?
      `, [user.user_id]);
      
      if (staff.length > 0) {
        additionalDetails = {
          hospital_id: staff[0].hospital_id,
          hospitalName: staff[0].hospital_name,
          hospital_name: staff[0].hospital_name,
          staff_id: staff[0].staff_id,
          designation: staff[0].designation,
          department: staff[0].department
        };
      }
    }

    res.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        name: `${user.first_name} ${user.last_name}`,
        role: user.user_role,
        phone: user.phone,
        ...additionalDetails
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;

    const updated = await User.update(req.user.user_id, updateData);
    
    if (!updated) {
      return res.status(400).json({ message: 'Profile update failed' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await User.comparePassword(currentPassword, users[0].password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [hashedPassword, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'Password change failed' });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};