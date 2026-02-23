const express = require('express');
const {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowingFeed,
} = require('../controllers/socialController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile (public)
router.get('/profile/:userId', getUserProfile);

// Follow/unfollow routes (require authentication)
router.post('/follow/:userToFollowId', auth, followUser);
router.post('/unfollow/:userToUnfollowId', auth, unfollowUser);
router.get('/following/:userToCheckId', auth, isFollowing);

// Get feed from followed users
router.get('/feed', auth, getFollowingFeed);

module.exports = router;
