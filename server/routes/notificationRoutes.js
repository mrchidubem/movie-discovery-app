const express = require('express');
const auth = require('../middleware/auth');
const UserNotification = require('../models/UserNotification');
const { sendMultiChannelNotification, sendInAppNotification } = require('../services/notificationService');

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

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await UserNotification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create and send notification (admin/system)
router.post('/', auth, async (req, res) => {
  try {
    const { userId, movieId, type, message, platform, channels } = req.body;
    
    // Send multi-channel notification
    const result = await sendMultiChannelNotification(userId || req.user.id, {
      type,
      message,
      movieId,
      movieTitle: message.includes('|') ? message.split('|')[1].trim() : 'Movie',
      platform,
      channels: channels || ['in-app'],
    });

    res.json({ 
      message: 'Notification sent',
      result 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to streaming notification (when movie arrives on platform)
router.post('/subscribe/:movieId', auth, async (req, res) => {
  try {
    const { platform } = req.body;
    
    // Create in-app notification showing subscription
    const notification = await sendInAppNotification(req.user.id, {
      movieId: req.params.movieId,
      type: 'STREAMING_ARRIVING',
      message: `You'll be notified when this movie is available on ${platform}`,
      platform,
    });

    res.json({ 
      message: `Subscribed to ${platform} updates for this movie`,
      notification 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    await UserNotification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test notification across all channels
router.post('/test-all', auth, async (req, res) => {
  try {
    const result = await sendMultiChannelNotification(req.user.id, {
      type: 'NEW_RELEASE',
      message: 'This is a test notification across all channels!',
      movieId: 'test-movie-123',
      movieTitle: 'Test Movie',
      platform: 'Test Platform',
      channels: ['all'],
    });

    res.json({
      message: 'Test notifications sent across all channels',
      result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

