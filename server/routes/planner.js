const express = require('express');
const router = express.Router();
const { generatePlan, getUserPlans, deleteUserPlan } = require('../controllers/plannerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/plan', protect, generatePlan);
router.get('/plans', protect, getUserPlans);
router.delete('/plans/:id', protect, deleteUserPlan);

module.exports = router;
