const express = require('express');
const auth = require('../middleware/auth');
const WatchlistNotification = require('../models/WatchlistNotification');
const { sendMultiChannelNotification } = require('../services/notificationService');

const router = express.Router();

/**
 * Create watchlist notification
 * User wants to be notified when a movie becomes available on their preferred platform
 */
router.post('/', auth, async (req, res) => {
  try {
    const { movieId, movieTitle, preferredPlatforms = [], priority = 'medium', poster } = req.body;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Check if already exists
    let notification = await WatchlistNotification.findOne({
      userId: req.user.id,
      movieId,
    });

    if (notification) {
      // Update existing notification
      notification.preferredPlatforms = preferredPlatforms;
      notification.priority = priority;
      await notification.save();
    } else {
      // Create new notification
      notification = await WatchlistNotification.create({
        userId: req.user.id,
        movieId,
        movieTitle,
        poster,
        preferredPlatforms,
        priority,
        notifyOnAvailable: true,
        notificationSent: false,
      });
    }

    res.json({
      message: 'Watchlist notification created',
      notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's watchlist notifications
 */
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await WatchlistNotification.find({ userId: req.user.id })
      .sort({ priority: -1, createdAt: -1 });

    const summary = {
      total: notifications.length,
      pending: notifications.filter(n => !n.notificationSent).length,
      sent: notifications.filter(n => n.notificationSent).length,
      byPriority: {
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length,
        'must-watch': notifications.filter(n => n.priority === 'must-watch').length,
      },
    };

    res.json({ notifications, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific watchlist notification
 */
router.get('/:notificationId', auth, async (req, res) => {
  try {
    const notification = await WatchlistNotification.findOne({
      _id: req.params.notificationId,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update watchlist notification
 */
router.put('/:notificationId', auth, async (req, res) => {
  try {
    const { movieTitle, preferredPlatforms, priority, notifyOnAvailable } = req.body;

    const notification = await WatchlistNotification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        userId: req.user.id,
      },
      {
        movieTitle,
        preferredPlatforms,
        priority,
        notifyOnAvailable,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification updated', notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete watchlist notification
 */
router.delete('/:notificationId', auth, async (req, res) => {
  try {
    const notification = await WatchlistNotification.findOneAndDelete({
      _id: req.params.notificationId,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark a movie as available and send notification
 * This would be called by a background job that checks streaming availability
 */
router.post('/:notificationId/mark-available', auth, async (req, res) => {
  try {
    const { availablePlatforms } = req.body;

    const notification = await WatchlistNotification.findOneAndUpdate(
      {
        _id: req.params.notificationId,
        userId: req.user.id,
      },
      {
        availableOn: availablePlatforms || [],
        notificationSent: true,
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Send multi-channel notification
    const platformsList = (availablePlatforms || []).join(', ') || 'your preferred platforms';
    await sendMultiChannelNotification(req.user.id, {
      type: 'STREAMING_ARRIVING',
      message: `🎬 "${notification.movieTitle}" is now available on ${platformsList}!`,
      movieId: notification.movieId,
      movieTitle: notification.movieTitle,
      platform: availablePlatforms?.[0] || 'Multiple',
      channels: ['all'], // Email, push, and in-app
    });

    res.json({
      message: 'Movie marked as available and notifications sent',
      notification,
      platformsList,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check all pending watchlist notifications and send alerts for available movies
 * This would be called periodically by a background job
 */
router.post('/check-availability', async (req, res) => {
  try {
    // This endpoint should be protected by an API key in production
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.BACKGROUND_JOB_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pendingNotifications = await WatchlistNotification.find({
      notificationSent: false,
      notifyOnAvailable: true,
    }).populate('userId');

    const results = {
      checked: pendingNotifications.length,
      notified: 0,
      errors: 0,
    };

    for (const notification of pendingNotifications) {
      try {
        // Here you would integrate with a streaming availability API
        // For now, we'll just log that it was checked
        
        // Example: Check if movie is available on preferred platforms
        // const availability = await checkMovieAvailability(notification.movieId);
        
        // For demo, simulate finding availability
        const simulatedAvailability = ['Netflix', 'Amazon Prime'];
        
        if (simulatedAvailability.length > 0) {
          await sendMultiChannelNotification(notification.userId._id, {
            type: 'STREAMING_ARRIVING',
            message: `🎬 "${notification.movieTitle}" is now available on ${simulatedAvailability.join(', ')}!`,
            movieId: notification.movieId,
            movieTitle: notification.movieTitle,
            platform: simulatedAvailability[0],
            channels: ['all'],
          });

          notification.notificationSent = true;
          notification.availableOn = simulatedAvailability;
          await notification.save();

          results.notified++;
        }
      } catch (error) {
        console.error(`Error processing notification ${notification._id}:`, error);
        results.errors++;
      }
    }

    res.json({
      message: 'Availability check completed',
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
