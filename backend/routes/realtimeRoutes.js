const express = require('express');
const router = express.Router();
const {
  getHospitalResources,
  getBedStatus,
  getAmbulanceStatus,
  getReferralUpdates,
  emitBedUpdate,
  emitReferralUpdate
} = require('../controllers/realtimeController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.use(protect);

router.get('/hospital-resources', authorize('Super Admin'), getHospitalResources);
router.get('/bed-status', getBedStatus);
router.get('/ambulance-status', getAmbulanceStatus);
router.get('/referral-updates', getReferralUpdates);

// Socket emission routes
router.post('/emit-bed-update', authorize('Hospital Admin', 'Super Admin'), emitBedUpdate);
router.post('/emit-referral-update', emitReferralUpdate);

module.exports = router;