const express = require('express');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');

const router = express.Router();

// Create payment intent (for Stripe)
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, subscriptionTier } = req.body;

    if (!amount || !subscriptionTier) {
      return res.status(400).json({ error: 'Amount and subscription tier required' });
    }

    // Stripe SDK integration placeholder
    const paymentIntent = {
      clientSecret: `test_secret_${Date.now()}`,
      amount,
      subscriptionTier,
      status: 'requires_payment_method',
    };

    res.json(paymentIntent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment (webhook from Stripe)
router.post('/confirm', auth, async (req, res) => {
  try {
    const { stripePaymentIntentId, subscriptionTier, amount, stripeCustomerId } = req.body;

    const payment = await Payment.create({
      userId: req.user.id,
      stripeCustomerId,
      stripePaymentIntentId,
      amount,
      status: 'completed',
      subscriptionTier,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.json({ message: 'Payment confirmed', payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active subscription
router.get('/subscription', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      userId: req.user.id,
      status: 'completed',
      subscriptionEndDate: { $gt: new Date() },
    }).sort({ subscriptionEndDate: -1 });

    if (!payment) {
      return res.json({ subscription: null, tier: 'FREE' });
    }

    res.json({ 
      subscription: payment, 
      tier: payment.subscriptionTier,
      active: new Date() < new Date(payment.subscriptionEndDate),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
