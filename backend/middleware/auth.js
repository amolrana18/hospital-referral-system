const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database with hospital information
      const [users] = await pool.execute(`
        SELECT u.user_id, u.email, u.user_role, u.is_active, u.first_name, u.last_name,
               hs.hospital_id, hs.staff_id, h.name as hospital_name
        FROM users u
        LEFT JOIN hospital_staff hs ON u.user_id = hs.user_id AND hs.is_active = TRUE
        LEFT JOIN hospitals h ON hs.hospital_id = h.hospital_id
        WHERE u.user_id = ?
      `, [decoded.id]);

      if (users.length === 0) {
        return res.status(401).json({ message: 'User not found' });
      }

      const user = users[0];
      
      // For Hospital Admin, get hospital_id from a different way if not in staff table
      if (user.user_role === 'Hospital Admin' && !user.hospital_id) {
        // Check if there's a direct hospital assignment for admin
        const [adminHospital] = await pool.execute(`
          SELECT hospital_id FROM hospitals WHERE created_by = ? OR updated_by = ?
          LIMIT 1
        `, [user.user_id, user.user_id]);
        
        if (adminHospital.length > 0) {
          user.hospital_id = adminHospital[0].hospital_id;
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_role)) {
      return res.status(403).json({
        message: `User role ${req.user.user_role} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };