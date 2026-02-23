const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripeCustomerId: String,
    stripePaymentIntentId: String,
    amount: Number,
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    subscriptionTier: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM'],
      default: 'FREE',
    },
    subscriptionEndDate: Date,
    receiptUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
