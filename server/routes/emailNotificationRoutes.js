const express = require('express');
const auth = require('../middleware/auth');
const EmailNotification = require('../models/EmailNotification');

const router = express.Router();

// Subscribe user to email notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { movieId, movieTitle, platform } = req.body;
    
    const notification = await EmailNotification.create({
      userId: req.user.id,
      movieId,
      movieTitle,
      platform,
      email: req.user.email,
    });

    res.json({ message: 'Email notification subscribed', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's email notification subscriptions
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await EmailNotification.find({ userId: req.user.id });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from email notification
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    await EmailNotification.findByIdAndDelete(req.params.notificationId);
    res.json({ message: 'Unsubscribed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
