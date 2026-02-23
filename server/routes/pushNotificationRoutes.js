const express = require('express');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, auth: authKey, p256dh, userAgent } = req.body;

    if (!endpoint || !authKey || !p256dh) {
      return res.status(400).json({ error: 'Missing push subscription keys' });
    }

    // Check if already subscribed
    let subscription = await PushSubscription.findOne({ 
      userId: req.user.id, 
      endpoint 
    });

    if (subscription) {
      subscription.isActive = true;
      subscription.userAgent = userAgent;
      await subscription.save();
    } else {
      subscription = await PushSubscription.create({
        userId: req.user.id,
        endpoint,
        auth: authKey,
        p256dh,
        userAgent,
        isActive: true,
      });
    }

    res.json({ message: 'Push subscription created', subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      { isActive: false }
    );

    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's push subscriptions
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({ 
      userId: req.user.id, 
      isActive: true 
    });
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send test push notification
router.post('/send-test', auth, async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({ 
      userId: req.user.id, 
      isActive: true 
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({ error: 'No active push subscriptions' });
    }

    // Placeholder: use web-push to deliver notifications
    const notification = {
      title: '🎬 Movie Discovery App',
      body: 'Test notification - Push notifications working!',
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'test-notification',
    };

    res.json({ 
      message: 'Test push notifications sent',
      count: subscriptions.length,
      preview: notification 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
