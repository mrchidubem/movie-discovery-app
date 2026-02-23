const express = require('express');
const multer = require('multer');
const { registerUser, loginUser, getUserProfile, updateUserProfile, uploadPhoto } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Register user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// Get user profile (current user)
router.get('/profile', auth, getUserProfile);

// Backwards-compatible alias for client code expecting /api/users/me
router.get('/me', auth, getUserProfile);

// Update user profile
router.put('/:id', auth, updateUserProfile);

// Upload photo
router.post('/upload-photo', auth, upload.single('photo'), uploadPhoto);

module.exports = router; 