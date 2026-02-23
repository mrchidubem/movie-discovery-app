const express = require('express');
const auth = require('../middleware/auth');
const UserNotification = require('../models/UserNotification');

const router = express.Router();

// Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await UserNotification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unread = notifications.filter(n => !n.read).length;
    res.json({ notifications, unread });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:notificationId/read', auth, async (req, res) => {
  try {
    const notification = await UserNotification.findByIdAndUpdate(
      req.params.notificationId,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notification (admin/system)
router.post('/', auth, async (req, res) => {
  try {
    const { userId, movieId, type, message, platform } = req.body;
    
    const notification = await UserNotification.create({
      userId,
      movieId,
      type,
      message,
      platform,
    });

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to streaming notification (when movie arrives on platform)
router.post('/subscribe/:movieId', auth, async (req, res) => {
  try {
    const { platform } = req.body;
    // Placeholder: integrate streaming availability watcher
    res.json({ message: `Subscribed to ${platform} updates for this movie` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
