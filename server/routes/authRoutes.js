const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfilePhoto } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);
router.patch('/profile-photo', protect, updateProfilePhoto);

module.exports = router;
