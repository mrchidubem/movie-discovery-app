const mongoose = require('mongoose');

const watchlistNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: {
      type: String,
      required: true,
    },
    title: String,
    poster: String,
    notifyOnAvailable: {
      type: Boolean,
      default: true,
    },
    preferredPlatforms: [String], // e.g., ['Netflix', 'Prime Video']
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'must-watch'],
      default: 'medium',
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    availableOn: [String], // platforms where it's available
  },
  { timestamps: true }
);

module.exports = mongoose.model('WatchlistNotification', watchlistNotificationSchema);
