const express = require('express');
const { getUserBadges, getCurrentUserBadges } = require('../controllers/badgeController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get badges for current user
router.get('/', auth, getCurrentUserBadges);

// Get badges for a specific user (public)
router.get('/user/:userId', getUserBadges);

module.exports = router;
