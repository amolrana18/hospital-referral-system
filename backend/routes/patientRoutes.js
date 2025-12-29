const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPatient,
  getPatient,
  getAllPatients,
  searchPatients,
  createPatientVisit
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Protected routes
router.use(protect);

router.get('/', getAllPatients);
router.get('/search', searchPatients);
router.get('/:id', getPatient);
router.post('/:id/visits', authorize('Doctor', 'Nurse'), createPatientVisit);

// Create patient (Doctor, Nurse, Hospital Admin)
router.post('/', authorize('Doctor', 'Nurse', 'Hospital Admin'),
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['Male', 'Female', 'Other', 'Unknown']).withMessage('Invalid gender'),
    body('phone_number').matches(/^[0-9]{10}$/).withMessage('Phone number must be 10 digits'),
    body('alternate_phone').optional().matches(/^[0-9]{10}$/).withMessage('Alternate phone must be 10 digits'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('blood_group').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']).withMessage('Invalid blood group'),
    body('emergency_contact_number').optional().matches(/^[0-9]{10}$/).withMessage('Emergency contact must be 10 digits'),
    body('aadhaar').optional().matches(/^[0-9]{12}$/).withMessage('Aadhaar must be 12 digits'),
    body('pan_number').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format'),
    body('pincode').optional().matches(/^[0-9]{6}$/).withMessage('Pincode must be 6 digits')
  ],
  validate,
  createPatient
);

module.exports = router;