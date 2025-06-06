
const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
