const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: String,
    auth: String,
    p256dh: String,
    userAgent: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
