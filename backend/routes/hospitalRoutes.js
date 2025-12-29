const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
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
} = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes
router.get('/states', getStates);
router.get('/districts', getDistricts);
router.get('/districts/:districtId/blocks', getBlocksByDistrict);
router.get('/', getHospitals); // Make hospitals list public for registration
router.get('/dashboard/stats', getDashboardStats); // Public stats for home page

// Protected routes
router.use(protect);
router.get('/:id', getHospital);
router.get('/:id/resources', getHospitalResources);
router.get('/:id/staff', getHospitalStaff);
router.post('/staff', authorize('Super Admin', 'Hospital Admin'), addHospitalStaff);

// Super Admin only routes
router.post('/', authorize('Super Admin'), 
  [
    body('name').notEmpty(),
    body('type').isIn(['Government', 'Private', 'Charitable', 'Trust', 'Medical College', 'AIIMS', 'ESI', 'Military']),
    body('hospital_level').isIn(['Primary Health Centre', 'Community Health Centre', 'Sub-District Hospital', 'District Hospital', 'Tertiary', 'Super Specialty', 'Medical College']),
    body('district_id').isInt(),
    body('bed_capacity').isInt({ min: 0 })
  ], 
  validate, 
  createHospital
);

router.put('/:id', authorize('Super Admin', 'Hospital Admin'), updateHospital);
router.put('/:id/beds', authorize('Super Admin', 'Hospital Admin'), updateBedAvailability);

module.exports = router;