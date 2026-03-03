# 📬 Notification System Documentation

## Overview
Movie Discovery App now includes an **industrial-standard notification system** with multi-channel support, comprehensive preferences, and audit logging.

---

## 🎯 Key Features

### 1. **Multi-Channel Notifications**
- **Email Notifications** - HTML-formatted emails with templates
- **Push Notifications** - Web Push API for browser notifications
- **In-App Notifications** - Real-time in-app alerts
- **SMS (Future)** - SMS support can be added

### 2. **Notification Types**
- `STREAMING_ARRIVING` - Movie arrives on streaming platform
- `STREAMING_LEAVING` - Movie leaving a streaming platform
- `NEW_RELEASE` - New movie releases
- `ACTOR_NEWS` - News about favorite actors
- `PAYMENT_CONFIRMED` - Subscription payment confirmed
- `SUBSCRIPTION_EXPIRING` - Subscription expiration reminder
- `REFUND_PROCESSED` - Refund notification

### 3. **User Preferences**
Each user can customize notifications:

```javascript
{
  emailNotifications: {
    enabled: true,
    streamingAlerts: true,
    newReleases: true,
    recommendations: false,
    weeklyDigest: true
  },
  pushNotifications: {
    enabled: true,
    streamingAlerts: true,
    newReleases: false,
    actorNews: false
  },
  inAppNotifications: {
    enabled: true
  },
  frequency: 'real-time' // or 'daily', 'weekly'
}
```

### 4. **Billing & Subscription Features**
- Accurate payment tracking with full history
- Multiple billing cycles (monthly, annual)
- Auto-renewal management
- Refund processing with 30-day window
- Receipt and invoice generation
- Failed payment tracking

---

## 🔧 API Endpoints

### Notifications
- `POST /api/notifications` - Send a notification
- `GET /api/notifications` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/test-all` - Send test notification

### Email Notifications
- `POST /api/emails/subscribe` - Subscribe to email alerts
- `GET /api/emails` - Get email subscriptions
- `DELETE /api/emails/:id` - Unsubscribe
- `POST /api/emails/send-test` - Send test email

### Push Notifications
- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push
- `GET /api/push` - Get active subscriptions
- `POST /api/push/send-test` - Send test push notification
- `GET /api/push/config/status` - Check if push service is configured

### Watchlist Notifications
- `POST /api/watchlist-notifications` - Add watchlist notification
- `GET /api/watchlist-notifications` - Get all watchlist notifications
- `PUT /api/watchlist-notifications/:id` - Update notification
- `DELETE /api/watchlist-notifications/:id` - Delete notification
- `POST /api/watchlist-notifications/:id/mark-available` - Mark movie as available

### Payments & Billing
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Payment history
- `GET /api/payments/subscription` - Active subscription
- `POST /api/payments/cancel` - Cancel subscription
- `POST /api/payments/refund/:id` - Refund a payment
- `GET /api/payments/billing-settings` - Billing preferences

---

## 🚀 Setup Instructions

### 1. Email Configuration (Gmail Example)
Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@moviediscovery.app
```

For Gmail:
1. Enable 2-factor authentication
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the app password in `SMTP_PASSWORD`

### 2. Push Notifications (Web Push)
Install web-push library:
```bash
npm install web-push
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Add to `.env`:
```
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:support@moviediscovery.app
```

### 3. Stripe Integration
Add to `.env`:
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
BACKGROUND_JOB_API_KEY=your_secure_key
```

### 4. Client-Side Web Push Registration
```javascript
// In your React component
import api from '../services/api';

async function subscribeToPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    await api.post('/api/push/subscribe', {
      endpoint: subscription.endpoint,
      auth: subscription.getKey('auth'),
      p256dh: subscription.getKey('p256dh')
    });
  }
}
```

---

## 📊 Notification Audit Logs

All notification events are logged in the `NotificationLog` collection:

```javascript
{
  userId: ObjectId,
  channel: 'EMAIL' | 'PUSH' | 'IN_APP',
  type: 'STREAMING_ARRIVING' | 'PAYMENT_CONFIRMED' | ...,
  status: 'success' | 'error' | 'skipped',
  metadata: {
    // Channel-specific details
    messageId: 'smtp_message_id',
    subscriptionsCount: 5,
    error: 'Service not configured'
  },
  createdAt: Date,
  updatedAt: Date
}
```

Query logs:
```javascript
// Get all notification logs for a user
const logs = await NotificationLog.find({ userId });

// Get failed notifications
const failed = await NotificationLog.find({ 
  userId, 
  status: 'error' 
}).sort({ createdAt: -1 });

// Get logs for specific channel
const emailLogs = await NotificationLog.find({ 
  userId, 
  channel: 'EMAIL' 
});
```

---

## 💳 Billing System Features

### Subscription Tiers
| Tier | Price | Features |
|------|-------|----------|
| FREE | $0/mo | Basic browsing |
| BASIC | $4.99/mo | Email alerts, streaming notifications |
| PREMIUM | $9.99/mo | All features + Push notifications, ad-free |

### Payment Status Tracking
- `PENDING` - Payment initiated
- `PROCESSING` - Being processed
- `COMPLETED` - Successful
- `FAILED` - Payment failed
- `REFUNDED` - Refunded to customer
- `CANCELLED` - Subscription cancelled

### Billing Cycles
- **Monthly** - Renews every 30 days
- **Annual** - Renews every 12 months (saves ~18%)

### Auto-Renewal
- Default: Enabled
- Can be disabled in settings
- Cancellation takes effect immediately

---

## 🧪 Testing Notifications

### Test In-App Notification
```bash
curl -X POST http://localhost:5000/api/notifications/test-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Email Notification
```bash
curl -X POST http://localhost:5000/api/emails/send-test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test Push Notification
```bash
curl -X POST http://localhost:5000/api/push/send-test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Check Push Service Status
```bash
curl -X GET http://localhost:5000/api/push/config/status
```

---

## 🛡️ Best Practices

### 1. Email Templates
- Keep subject lines under 50 characters
- Use clear call-to-action buttons
- Include unsubscribe link
- Mobile-responsive design

### 2. Push Notifications
- Keep messages concise (≤150 characters)
- Use vibration patterns for importance
- Include relevant icons and badges
- Test on different browsers

### 3. Notification Frequency
- Real-time: Important alerts only
- Daily: Digest format for less urgent items
- Weekly: Summary of user activity

### 4. Privacy & Compliance
- Always get explicit consent
- Provide clear opt-out options
- GDPR compliant (right to be forgotten)
- Secure data storage

---

## 📱 Notification Preference Settings

Users can manage preferences at `/profile/settings`:

```javascript
{
  // Email preferences
  emailNotifications: {
    enabled: true,           // Master toggle
    streamingAlerts: true,   // When movies arrive/leave
    newReleases: true,       // New movie releases
    recommendations: false,  // Personalized recommendations
    weeklyDigest: true       // Weekly summary
  },
  
  // Push notification preferences
  pushNotifications: {
    enabled: true,
    streamingAlerts: true,
    newReleases: false,
    actorNews: false
  },
  
  // In-app notification settings
  inAppNotifications: {
    enabled: true
  },
  
  // Notification frequency
  frequency: 'real-time'  // 'real-time', 'daily', 'weekly'
}
```

---

## 🔄 Background Jobs

### Check Streaming Availability
Run periodically to update watchlist notifications:
```bash
curl -X POST http://localhost:5000/api/watchlist-notifications/check-availability \
  -H "x-api-key: YOUR_BACKGROUND_JOB_API_KEY"
```

Recommended: Run every 6-12 hours

### Send Digest Emails
For users with weekly/daily preference:
- Query users where `frequency: 'weekly'` or `'daily'`
- Aggregate notifications since last digest
- Send summarized email
- Mark notifications as sent

---

## 📈 Monitoring & Analytics

Track notification effectiveness:
```javascript
// Success rate by channel
const stats = await NotificationLog.aggregate([
  { $group: {
    _id: '$channel',
    total: { $sum: 1 },
    success: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
    error: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } }
  }}
]);

// Cost analysis
const costs = {
  email: 0.0001,      // per email
  push: 0,            // free (native)
  inApp: 0            // free (in-house)
};
```

---

## ⚠️ Common Issues & Solutions

### Email Not Sending
**Issue**: Emails not being sent
**Solutions**:
- Verify SMTP credentials in `.env`
- Check firewall/port 587 is accessible
- Verify Gmail app password is correct
- Check email bounce rate (Gmail metrics)

### Push Notifications Not Working
**Issue**: Push notifications failing
**Solutions**:
- Install web-push: `npm install web-push`
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- Ensure browser supports Web Push API
- Check service worker is registered

### Payment API Errors
**Issue**: Stripe integration failing
**Solutions**:
- Verify Stripe API keys in `.env`
- Use test keys for development
- Check network connectivity
- Review Stripe dashboard for errors

---

## 📞 Support & Troubleshooting

For issues:
1. Check notification logs: `GET /api/notifications`
2. Review server logs for errors
3. Test individual channels
4. Verify user preferences are set
5. Check `.env` configuration

---

**Version**: 1.0.0  
**Last Updated**: March 3, 2026  
**Status**: Production Ready ✅
