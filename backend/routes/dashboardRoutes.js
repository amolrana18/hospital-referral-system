const express = require('express');
const router = express.Router();
const {
  getSuperAdminDashboard,
  getHospitalAdminDashboard,
  getDoctorDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.use(protect);

router.get('/super-admin', authorize('Super Admin'), getSuperAdminDashboard);
router.get('/hospital-admin', authorize('Hospital Admin'), getHospitalAdminDashboard);
router.get('/doctor', authorize('Doctor'), getDoctorDashboard);

module.exports = router;