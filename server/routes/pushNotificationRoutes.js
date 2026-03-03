const express = require('express');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const { sendPushToMany, createNotificationPayload, pushServiceConfig } = require('../services/pushNotificationService');
const { logNotification } = require('../services/notificationService');

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
      subscription.updatedAt = new Date();
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

    await logNotification(req.user.id, 'PUSH', 'SUBSCRIPTION', 'success', {
      subscriptionId: subscription._id,
      endpoint,
    });

    res.json({ 
      message: 'Push subscription created',
      subscription,
      status: 'subscribed',
    });
  } catch (error) {
    await logNotification(req.user.id, 'PUSH', 'SUBSCRIPTION', 'error', {
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;

    const subscription = await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      { isActive: false }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await logNotification(req.user.id, 'PUSH', 'UNSUBSCRIPTION', 'success', {
      endpoint,
    });

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

    res.json({
      subscriptions,
      count: subscriptions.length,
      pushServiceAvailable: pushServiceConfig.isConfigured,
    });
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
      return res.status(400).json({ 
        error: 'No active push subscriptions',
        message: 'Please enable push notifications in your browser first',
      });
    }

    if (!pushServiceConfig.isConfigured) {
      return res.status(400).json({
        error: 'Push notification service not configured',
        message: 'Please configure VAPID keys for push notifications',
      });
    }

    const notification = createNotificationPayload({
      title: '🎬 Movie Discovery App',
      body: 'Test notification - Push notifications are working!',
      icon: '/logo.png',
      badge: '/badge.png',
      tag: 'test-notification',
      type: 'normal',
      movieId: 'test',
      movieTitle: 'Test Notification',
    });

    const results = await sendPushToMany(subscriptions, notification);

    // Clean up expired subscriptions
    if (results.expired.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: results.expired } });
    }

    await logNotification(req.user.id, 'PUSH', 'TEST', 'success', {
      sent: results.successful,
      failed: results.failed,
      expired: results.expired.length,
    });

    res.json({ 
      message: 'Test push notifications sent',
      results: {
        successful: results.successful,
        failed: results.failed,
        expiredRemoved: results.expired.length,
      },
      preview: notification 
    });
  } catch (error) {
    await logNotification(req.user.id, 'PUSH', 'TEST', 'error', {
      error: error.message,
    });
    res.status(500).json({ error: error.message });
  }
});

// Send notification to all subscribed devices
router.post('/send-to-all', auth, async (req, res) => {
  try {
    const { title, body, movieId, movieTitle, platform, type = 'normal' } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }

    const subscriptions = await PushSubscription.find({ 
      userId: req.user.id, 
      isActive: true 
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({ error: 'No active push subscriptions' });
    }

    const notification = createNotificationPayload({
      title,
      body,
      type,
      movieId,
      movieTitle,
      platform,
    });

    const results = await sendPushToMany(subscriptions, notification);

    // Clean up expired subscriptions
    if (results.expired.length > 0) {
      await PushSubscription.deleteMany({ _id: { $in: results.expired } });
    }

    res.json({ 
      message: 'Notifications sent',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if push service is configured
router.get('/config/status', (req, res) => {
  res.json({
    configured: pushServiceConfig.isConfigured,
    message: pushServiceConfig.isConfigured 
      ? 'Push notifications are available'
      : 'Push notifications service not configured. Install web-push and set VAPID keys.',
  });
});

module.exports = router;
