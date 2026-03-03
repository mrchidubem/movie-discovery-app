/**
 * Web Push Notification Service
 * Requires web-push library: npm install web-push
 */

// Note: In production, install: npm install web-push
// And configure VAPID keys in .env:
// VAPID_PUBLIC_KEY=your_public_key
// VAPID_PRIVATE_KEY=your_private_key

const pushServiceConfig = {
  isConfigured: !!(
    process.env.VAPID_PUBLIC_KEY && 
    process.env.VAPID_PRIVATE_KEY
  ),
};

let webPush;

try {
  if (pushServiceConfig.isConfigured) {
    webPush = require('web-push');
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:support@moviediscovery.app',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch (error) {
  console.warn('⚠️ web-push library not installed. Push notifications will be disabled.');
  console.warn('To enable push notifications, run: npm install web-push');
}

/**
 * Send push notification to subscription
 */
const sendPushToSubscription = async (subscription, notification) => {
  try {
    if (!webPush || !pushServiceConfig.isConfigured) {
      console.warn('Push notifications not configured. Skipping...');
      return { success: false, reason: 'not_configured' };
    }

    await webPush.sendNotification(subscription, JSON.stringify(notification));

    return { 
      success: true,
      message: 'Push notification sent successfully',
    };
  } catch (error) {
    // Handle subscription expiration
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { 
        success: false,
        reason: 'subscription_expired',
        shouldDelete: true,
      };
    }

    console.error('Error sending push notification:', error);
    return {
      success: false,
      reason: 'send_failed',
      error: error.message,
    };
  }
};

/**
 * Send push notifications to multiple subscriptions
 */
const sendPushToMany = async (subscriptions, notification) => {
  const results = {
    successful: 0,
    failed: 0,
    expired: [],
  };

  for (const sub of subscriptions) {
    const result = await sendPushToSubscription(sub, notification);
    
    if (result.success) {
      results.successful++;
    } else {
      results.failed++;
      if (result.shouldDelete) {
        results.expired.push(sub._id);
      }
    }
  }

  return results;
};

/**
 * Generate vibration pattern for notification importance
 */
const getVibrationPattern = (priority = 'normal') => {
  const patterns = {
    low: [50],
    normal: [200, 100, 200],
    high: [400, 300, 400],
    urgent: [400, 200, 400, 200, 400],
  };
  return patterns[priority] || patterns.normal;
};

/**
 * Generate badge icon based on notification type
 */
const getBadgeIcon = (type) => {
  const icons = {
    'STREAMING_ARRIVING': '🎬',
    'STREAMING_LEAVING': '⏰',
    'NEW_RELEASE': '✨',
    'PAYMENT_CONFIRMED': '💳',
    'SUBSCRIPTION_EXPIRING': '⏳',
  };
  return icons[type] || '🔔';
};

/**
 * Create notification payload
 */
const createNotificationPayload = (options) => {
  const {
    title = 'Movie Discovery',
    body = 'New notification',
    icon = '/logo.png',
    badge = '/badge.png',
    tag = 'notification',
    type = 'normal',
    movieId = null,
    movieTitle = null,
    platform = null,
    action = null,
  } = options;

  return {
    title,
    body,
    icon,
    badge,
    tag,
    vibrate: getVibrationPattern(type),
    timestamp: Date.now(),
    data: {
      type,
      movieId,
      movieTitle,
      platform,
      action: action || 'open-app',
      url: movieId ? `/movies/${movieId}` : '/',
    },
    actions: [
      {
        action: 'open-app',
        title: 'Open App',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };
};

module.exports = {
  pushServiceConfig,
  sendPushToSubscription,
  sendPushToMany,
  createNotificationPayload,
  getVibrationPattern,
  getBadgeIcon,
};
