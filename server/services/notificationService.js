const nodemailer = require('nodemailer');
const User = require('../models/User');
const UserNotification = require('../models/UserNotification');
const EmailNotification = require('../models/EmailNotification');
const PushSubscription = require('../models/PushSubscription');
const NotificationLog = require('../models/NotificationLog');

/**
 * Centralized Notification Service
 * Handles all notification types: email, push, in-app
 */

// Setup nodemailer transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'your-app-password',
  },
});

/**
 * Send in-app notification
 */
const sendInAppNotification = async (userId, { movieId, type, message, platform }) => {
  try {
    const notification = await UserNotification.create({
      userId,
      movieId,
      type,
      message,
      platform,
    });

    await logNotification(userId, 'IN_APP', type, 'success', {
      notificationId: notification._id,
      message,
    });

    return notification;
  } catch (error) {
    await logNotification(userId, 'IN_APP', type, 'error', { error: error.message });
    console.error('Error sending in-app notification:', error);
    throw error;
  }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (userId, { movieId, movieTitle, type, platform, subject, htmlContent }) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user has email notifications enabled
    if (!user.notificationPreferences.emailNotifications.enabled) {
      await logNotification(userId, 'EMAIL', type, 'skipped', {
        reason: 'User disabled email notifications',
      });
      return null;
    }

    // Check specific notification type preference
    const typeKey = type.toLowerCase().replace(/_/g, '');
    if (!user.notificationPreferences.emailNotifications[typeKey]) {
      await logNotification(userId, 'EMAIL', type, 'skipped', {
        reason: `User disabled ${type} notifications`,
      });
      return null;
    }

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@moviediscovery.app',
      to: user.email,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    // Log email notification as sent
    const emailNotif = await EmailNotification.create({
      userId,
      movieId,
      movieTitle,
      type,
      platform,
      email: user.email,
      sent: true,
      sentAt: new Date(),
    });

    await logNotification(userId, 'EMAIL', type, 'success', {
      notificationId: emailNotif._id,
      messageId: info.messageId,
      email: user.email,
    });

    return emailNotif;
  } catch (error) {
    await logNotification(userId, 'EMAIL', type, 'error', { error: error.message });
    console.error('Error sending email notification:', error);
    throw error;
  }
};

/**
 * Send push notification (web push)
 */
const sendPushNotification = async (userId, { title, body, icon, badge, tag, data }) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.notificationPreferences.pushNotifications.enabled) {
      await logNotification(userId, 'PUSH', 'UNKNOWN', 'skipped', {
        reason: 'User disabled push notifications',
      });
      return null;
    }

    const subscriptions = await PushSubscription.find({
      userId,
      isActive: true,
    });

    if (subscriptions.length === 0) {
      await logNotification(userId, 'PUSH', 'UNKNOWN', 'skipped', {
        reason: 'No active push subscriptions',
      });
      return null;
    }

    const notification = {
      title,
      body,
      icon,
      badge,
      tag,
      data,
      timestamp: new Date().toISOString(),
    };

    // Note: Actual web-push sending would happen here with the web-push library
    // For now, we're just logging the intent
    await logNotification(userId, 'PUSH', data?.type || 'UNKNOWN', 'success', {
      subscriptionsCount: subscriptions.length,
      title,
      body,
    });

    return {
      sent: true,
      subscriptionsCount: subscriptions.length,
      notification,
    };
  } catch (error) {
    await logNotification(userId, 'PUSH', 'UNKNOWN', 'error', { error: error.message });
    console.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send combined notification (multi-channel)
 */
const sendMultiChannelNotification = async (userId, { type, message, movieId, movieTitle, platform, channels = ['in-app'] }) => {
  const results = {
    inApp: null,
    email: null,
    push: null,
  };

  try {
    // In-app notification (always send if user is authenticated)
    if (channels.includes('in-app') || channels.includes('all')) {
      results.inApp = await sendInAppNotification(userId, {
        movieId,
        type,
        message,
        platform,
      });
    }

    // Email notification
    if (channels.includes('email') || channels.includes('all')) {
      const htmlContent = generateEmailTemplate(type, message, movieTitle, platform);
      results.email = await sendEmailNotification(userId, {
        movieId,
        movieTitle,
        type,
        platform,
        subject: `${type.replace(/_/g, ' ')} - Movie Discovery App`,
        htmlContent,
      });
    }

    // Push notification
    if (channels.includes('push') || channels.includes('all')) {
      results.push = await sendPushNotification(userId, {
        title: 'Movie Discovery Alert',
        body: message,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: type.toLowerCase(),
        data: { movieId, type, platform },
      });
    }

    return results;
  } catch (error) {
    console.error('Error sending multi-channel notification:', error);
    throw error;
  }
};

/**
 * Generate email template
 */
const generateEmailTemplate = (type, message, movieTitle, platform) => {
  const typeEmojis = {
    'STREAMING_ARRIVING': '✨',
    'STREAMING_LEAVING': '👋',
    'NEW_RELEASE': '🎬',
    'ACTOR_NEWS': '⭐',
  };

  const emoji = typeEmojis[type] || '🎬';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
          .movie-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} ${type.replace(/_/g, ' ')}</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>${message}</p>
            <div class="movie-info">
              <strong>Movie:</strong> ${movieTitle || 'N/A'}<br>
              <strong>Platform:</strong> ${platform || 'N/A'}<br>
            </div>
            <p>Log in to your Movie Discovery account to view more details.</p>
            <a href="${process.env.CLIENT_URL || 'https://moviediscovery.app'}" class="cta-button">View in App</a>
          </div>
          <div class="footer">
            <p>You're receiving this email because you've enabled notifications for Movie Discovery.</p>
            <p><a href="${process.env.CLIENT_URL || 'https://moviediscovery.app'}/settings">Manage notification preferences</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Log notification for audit trail
 */
const logNotification = async (userId, channel, type, status, metadata = {}) => {
  try {
    await NotificationLog.create({
      userId,
      channel, // EMAIL, PUSH, IN_APP
      type,
      status, // success, error, skipped
      metadata,
    });
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

/**
 * Test email configuration
 */
const testEmailConfiguration = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is configured correctly');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendInAppNotification,
  sendEmailNotification,
  sendPushNotification,
  sendMultiChannelNotification,
  logNotification,
  testEmailConfiguration,
};
