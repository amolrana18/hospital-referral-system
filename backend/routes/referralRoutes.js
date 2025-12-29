const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createReferral,
  getReferrals,
  getReferral,
  getReferralTimeline,
  updateReferralStatus,
  addTreatmentUpdate,
  getReferralStats
} = require('../controllers/referralController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Protected routes
router.use(protect);

router.get('/', getReferrals);
router.get('/stats', getReferralStats);
router.get('/stats/timeline', (req, res) => {
  res.json({ success: true, data: [] }); // Placeholder for timeline stats
});
router.get('/:id', getReferral);
router.get('/:id/timeline', getReferralTimeline);

// Create referral (Doctor, Nurse, Hospital Admin)
router.post('/', authorize('Doctor', 'Nurse', 'Hospital Admin'),
  [
    body('patient_id').isInt(),
    body('receiving_hospital_id').isInt(),
    body('reason_for_referral').notEmpty(),
    body('clinical_summary').optional(),
    body('priority').optional().isIn(['Normal', 'Routine', 'Urgent', 'Emergency', 'Critical']),
    body('bed_required').optional().isBoolean(),
    body('doctor_required').optional().isBoolean(),
    body('ambulance_required').optional().isBoolean()
  ],
  validate,
  createReferral
);

// Update status (Hospital Admin)
router.put('/:id/status', authorize('Hospital Admin'),
  [
    body('status').isIn(['Approved', 'Rejected', 'Completed', 'In Transit', 'Admitted']),
    body('review_notes').optional()
  ],
  validate,
  updateReferralStatus
);

// Add treatment update (Doctor, Nurse)
router.post('/:id/updates', authorize('Doctor', 'Nurse'),
  [
    body('update_notes').notEmpty(),
    body('update_type').isIn(['Consultation', 'Procedure', 'Medication', 'Discharge', 'Follow-up', 'Surgery', 'Investigation', 'Observation'])
  ],
  validate,
  addTreatmentUpdate
);

module.exports = router;