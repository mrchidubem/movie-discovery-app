const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: String,
    stripeInvoiceId: String,
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_transfer'],
      default: 'card',
    },
    subscriptionTier: {
      type: String,
      enum: ['FREE', 'BASIC', 'PREMIUM'],
      default: 'FREE',
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'annual'],
      default: 'monthly',
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    receiptUrl: String,
    invoiceUrl: String,
    refundAmount: Number,
    refundDate: Date,
    refundReason: String,
    failureReason: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for finding active subscriptions
paymentSchema.index({ userId: 1, status: 1, subscriptionEndDate: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
