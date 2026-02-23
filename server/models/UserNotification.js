const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    movieId: String,
    type: {
      type: String,
      enum: ['STREAMING_ARRIVING', 'STREAMING_LEAVING', 'NEW_RELEASE', 'ACTOR_NEW_MOVIE'],
      required: true,
    },
    message: String,
    platform: String, // Netflix, ShowMax, etc
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserNotification', userNotificationSchema);
