# 🚀 Notification System - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd server
npm install nodemailer web-push
```

### Step 2: Configure Email (Gmail Example)
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Generate password for Mail on Windows
3. Add to `.env`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Step 3: Generate Push Keys
```bash
npx web-push generate-vapid-keys
```

Add output to `.env`:
```bash
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### Step 4: Test Notifications

#### Test In-App Notification
```bash
curl -X POST http://localhost:5000/api/notifications/test-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Test Email
```bash
curl -X POST http://localhost:5000/api/emails/send-test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Check Push Status
```bash
curl http://localhost:5000/api/push/config/status
```

---

## Common Usage Examples

### Send Notification to User
```javascript
const { sendMultiChannelNotification } = require('./services/notificationService');

await sendMultiChannelNotification(userId, {
  type: 'STREAMING_ARRIVING',
  message: 'Your favorite movie is now on Netflix!',
  movieId: 'movie-123',
  movieTitle: 'Inception',
  platform: 'Netflix',
  channels: ['all'] // or ['email', 'push', 'in-app']
});
```

### Check User Preferences
```javascript
const user = await User.findById(userId);
if (user.notificationPreferences.emailNotifications.enabled) {
  // Send email notification
}
```

### Get User's Notifications
```javascript
const response = await api.get('/api/notifications');
console.log(response.data.notifications, response.data.unread);
```

### Subscribe to Watchlist
```javascript
await api.post('/api/watchlist-notifications', {
  movieId: 'movie-456',
  movieTitle: 'The Matrix',
  preferredPlatforms: ['Netflix', 'Amazon Prime'],
  priority: 'high'
});
```

### Handle Payment
```javascript
// Create payment intent
const intent = await api.post('/api/payments/create-payment-intent', {
  subscriptionTier: 'PREMIUM',
  billingCycle: 'monthly'
});

// Confirm after Stripe payment
await api.post('/api/payments/confirm', {
  stripePaymentIntentId: intent.clientSecret,
  subscriptionTier: 'PREMIUM',
  billingCycle: 'monthly',
  amount: intent.amount,
  stripeCustomerId: 'cust_...'
});
```

---

## User Preference Structure

```javascript
const preferences = {
  // Email settings
  emailNotifications: {
    enabled: true,                           // Master toggle
    streamingAlerts: true,                   // When movies arrive/leave
    newReleases: true,                       // New releases
    recommendations: false,                  // Personalized picks
    weeklyDigest: true                       // Weekly summary
  },

  // Push settings
  pushNotifications: {
    enabled: true,
    streamingAlerts: true,
    newReleases: false,
    actorNews: false
  },

  // In-app settings
  inAppNotifications: {
    enabled: true
  },

  // Frequency
  frequency: 'real-time'  // 'real-time', 'daily', 'weekly'
};
```

---

## API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications` | GET | Get user's notifications |
| `/api/notifications/test-all` | POST | Send test notification |
| `/api/emails/send-test` | POST | Send test email |
| `/api/push/send-test` | POST | Send test push |
| `/api/watchlist-notifications` | POST | Add to watchlist |
| `/api/payments/create-payment-intent` | POST | Create Stripe intent |
| `/api/payments/subscription` | GET | Get active subscription |

---

## Troubleshooting

### Email not sending?
```bash
# Check config
curl http://localhost:5000/api/emails/send-test

# Verify .env has:
# SMTP_HOST, SMTP_USER, SMTP_PASSWORD
```

### Push not working?
```bash
# Check status
curl http://localhost:5000/api/push/config/status

# Generate keys if needed:
npx web-push generate-vapid-keys
```

### Payment failing?
```bash
# Check Stripe keys in .env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Use test card: 4242 4242 4242 4242
```

---

## Environment Variables Checklist

Required for production:
- [ ] SMTP_HOST
- [ ] SMTP_USER
- [ ] SMTP_PASSWORD
- [ ] VAPID_PUBLIC_KEY
- [ ] VAPID_PRIVATE_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_SECRET_KEY

Optional but recommended:
- [ ] BACKGROUND_JOB_API_KEY
- [ ] ENABLE_NOTIFICATION_AUDIT_LOG
- [ ] REFUND_WINDOW_DAYS

---

## Files You Need to Know

| File | Purpose |
|------|---------|
| `notificationService.js` | Main notification logic |
| `pushNotificationService.js` | Web Push API |
| `User.js` | User preferences model |
| `Payment.js` | Billing model |
| `NotificationLog.js` | Audit trail |
| `NOTIFICATION_SYSTEM.md` | Full documentation |

---

## Next: Test Your Setup

1. ✅ Install dependencies
2. ✅ Add `.env` variables
3. ✅ Start server: `npm start`
4. ✅ Run tests above
5. ✅ Check app works
6. ✅ Deploy!

---

**Need help?** Check [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md) for detailed docs.
