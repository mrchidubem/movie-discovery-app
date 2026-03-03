const express = require('express');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendMultiChannelNotification } = require('../services/notificationService');

const router = express.Router();

// Pricing configuration (in cents)
const PRICING = {
  BASIC: {
    monthly: 499,      // $4.99/month
    annual: 4990,      // $49.90/year (saves ~20%)
  },
  PREMIUM: {
    monthly: 999,      // $9.99/month
    annual: 9990,      // $99.90/year (saves ~17%)
  },
};

/**
 * Create payment intent (for Stripe)
 */
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { subscriptionTier, billingCycle = 'monthly' } = req.body;

    if (!subscriptionTier || !['BASIC', 'PREMIUM'].includes(subscriptionTier)) {
      return res.status(400).json({ error: 'Valid subscription tier required' });
    }

    if (!['monthly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({ error: 'Valid billing cycle required (monthly/annual)' });
    }

    const amount = PRICING[subscriptionTier][billingCycle];

    // In production, this would create a real Stripe PaymentIntent
    const paymentIntent = {
      clientSecret: `pi_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency: 'usd',
      subscriptionTier,
      billingCycle,
      status: 'requires_payment_method',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_fake_key',
    };

    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Confirm payment and create subscription
 */
router.post('/confirm', auth, async (req, res) => {
  try {
    const { stripePaymentIntentId, subscriptionTier, billingCycle, amount, stripeCustomerId } = req.body;

    if (!stripePaymentIntentId || !subscriptionTier || !amount) {
      return res.status(400).json({ error: 'Missing required payment information' });
    }

    // Calculate subscription end date
    const startDate = new Date();
    const endDate = new Date();
    
    if (billingCycle === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create payment record
    const payment = await Payment.create({
      userId: req.user.id,
      stripeCustomerId: stripeCustomerId || `cust_test_${Date.now()}`,
      stripePaymentIntentId,
      amount,
      currency: 'usd',
      status: 'COMPLETED',
      paymentMethod: 'card',
      subscriptionTier,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
      billingCycle,
      autoRenew: true,
      receiptUrl: `https://stripe.example.com/receipts/${stripePaymentIntentId}`,
      invoiceUrl: `https://stripe.example.com/invoices/${Date.now()}`,
      metadata: {
        description: `${subscriptionTier} subscription (${billingCycle})`,
      },
    });

    // Send confirmation notification
    await sendMultiChannelNotification(req.user.id, {
      type: 'PAYMENT_CONFIRMED',
      message: `✅ Subscription confirmed! You now have access to ${subscriptionTier} features.`,
      movieId: null,
      movieTitle: `${subscriptionTier} Subscription`,
      platform: 'Movie Discovery',
      channels: ['email', 'in-app'],
    });

    res.status(201).json({
      message: 'Payment confirmed and subscription activated',
      payment,
      nextBillingDate: endDate,
    });
  } catch (error) {
    await Payment.create({
      userId: req.user.id,
      stripePaymentIntentId: req.body.stripePaymentIntentId,
      amount: req.body.amount,
      status: 'FAILED',
      failureReason: error.message,
    });

    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user's payment history
 */
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const summary = {
      totalPayments: payments.length,
      totalSpent: payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + (p.amount || 0), 0) / 100,
      activeSubscription: payments.find(
        p => p.status === 'COMPLETED' && new Date() < new Date(p.subscriptionEndDate)
      ),
    };

    res.json({ payments, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active subscription
 */
router.get('/subscription', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      userId: req.user.id,
      status: 'COMPLETED',
      subscriptionEndDate: { $gt: new Date() },
    }).sort({ subscriptionEndDate: -1 });

    if (!payment) {
      return res.json({
        subscription: null,
        tier: 'FREE',
        active: false,
        message: 'No active subscription. Upgrade to unlock premium features!',
      });
    }

    const daysRemaining = Math.ceil(
      (new Date(payment.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    res.json({
      subscription: payment,
      tier: payment.subscriptionTier,
      active: true,
      daysRemaining,
      renews: payment.autoRenew,
      nextBillingDate: payment.subscriptionEndDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', auth, async (req, res) => {
  try {
    const activePayment = await Payment.findOne({
      userId: req.user.id,
      status: 'COMPLETED',
      subscriptionEndDate: { $gt: new Date() },
    });

    if (!activePayment) {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    activePayment.status = 'CANCELLED';
    activePayment.autoRenew = false;
    await activePayment.save();

    // Send cancellation notification
    await sendMultiChannelNotification(req.user.id, {
      type: 'SUBSCRIPTION_CANCELLED',
      message: `Your ${activePayment.subscriptionTier} subscription has been cancelled. Access expires on ${activePayment.subscriptionEndDate.toLocaleDateString()}.`,
      movieId: null,
      movieTitle: 'Subscription Cancelled',
      platform: 'Movie Discovery',
      channels: ['email', 'in-app'],
    });

    res.json({
      message: 'Subscription cancelled successfully',
      expiresAt: activePayment.subscriptionEndDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Refund payment
 */
router.post('/refund/:paymentId', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      userId: req.user.id,
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === 'REFUNDED') {
      return res.status(400).json({ error: 'Payment already refunded' });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    // Check refund window (30 days)
    const daysSincePurchase = Math.floor(
      (new Date() - new Date(payment.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase > 30) {
      return res.status(400).json({
        error: 'Refund window expired (30 days)',
        daysSincePurchase,
      });
    }

    payment.status = 'REFUNDED';
    payment.refundAmount = payment.amount;
    payment.refundDate = new Date();
    payment.refundReason = reason || 'Customer requested refund';
    await payment.save();

    // Send refund notification
    await sendMultiChannelNotification(req.user.id, {
      type: 'REFUND_PROCESSED',
      message: `Refund of $${(payment.refundAmount / 100).toFixed(2)} has been processed. It may take 3-5 business days to appear in your account.`,
      movieId: null,
      movieTitle: 'Refund Processed',
      platform: 'Movie Discovery',
      channels: ['email', 'in-app'],
    });

    res.json({
      message: 'Refund processed successfully',
      payment,
      refundAmount: `$${(payment.refundAmount / 100).toFixed(2)}`,
      processingTime: '3-5 business days',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get billing settings
 */
router.get('/billing-settings', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const activeSubscription = await Payment.findOne({
      userId: req.user.id,
      status: 'COMPLETED',
      subscriptionEndDate: { $gt: new Date() },
    });

    res.json({
      email: user.email,
      currentTier: activeSubscription?.subscriptionTier || 'FREE',
      autoRenew: activeSubscription?.autoRenew || false,
      nextBillingDate: activeSubscription?.subscriptionEndDate || null,
      billingCycle: activeSubscription?.billingCycle || 'monthly',
      pricing: PRICING,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
