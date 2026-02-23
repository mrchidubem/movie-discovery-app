const mongoose = require('mongoose');

const emailNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: String,
    movieTitle: String,
    type: {
      type: String,
      enum: ['STREAMING_ALERT', 'NEW_RELEASE', 'ACTOR_NEWS'],
    },
    platform: String,
    email: String,
    sent: {
      type: Boolean,
      default: false,
    },
    sentAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailNotification', emailNotificationSchema);
