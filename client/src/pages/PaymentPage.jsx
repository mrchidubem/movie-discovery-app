import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import axios from 'axios';
import './PaymentPage.css';

const PaymentPage = () => {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState('BASIC');
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/payments/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (tier) => {
    setLoading(true);
    try {
      const amount = tier === 'BASIC' ? 499 : 999; // in cents
      const response = await api.post('/payments/create-payment-intent', {
        amount,
        subscriptionTier: tier,
      });

      // Placeholder: integrate Stripe.js client-side
      alert(`✅ Ready to subscribe to ${tier} ($${(amount / 100).toFixed(2)}/mo)`);
      setSelectedTier(tier);
      
      // Simulate payment confirmation
      await api.post('/payments/confirm', {
        ...response.data,
        stripeCustomerId: `cust_${Date.now()}`,
      });

      await fetchSubscription();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tiers = [
    {
      name: 'FREE',
      price: 0,
      features: [
        '✓ Browse movies',
        '✓ Search & filters',
        '✓ Add favorites',
        '✓ Basic recommendations',
      ],
    },
    {
      name: 'BASIC',
      price: 4.99,
      features: [
        '✓ All Free features',
        '✓ Email alerts',
        '✓ Streaming notifications',
        '✓ Advanced analytics',
      ],
    },
    {
      name: 'PREMIUM',
      price: 9.99,
      features: [
        '✓ All Basic features',
        '✓ Ad-free experience',
        '✓ Priority recommendations',
        '✓ Social features',
        '✓ Push notifications',
      ],
    },
  ];

  const activeTier = subscription?.tier || 'FREE';
  const isSubscribed = subscription?.active;

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1>Choose Your Plan</h1>
        <p className="subtitle">
          {isSubscribed && activeTier !== 'FREE'
            ? `You're currently on ${activeTier} plan`
            : 'Upgrade to unlock premium features'}
        </p>

        <div className="tiers-grid">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`tier-card ${
                activeTier === tier.name ? 'active' : ''
              } ${tier.name === 'PREMIUM' ? 'recommended' : ''}`}
            >
              <h2>{tier.name}</h2>
              <div className="price">
                ${tier.price}/mo
              </div>
              <ul className="features">
                {tier.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <button
                className={`subscribe-btn ${
                  activeTier === tier.name ? 'current' : ''
                }`}
                onClick={() => handleSubscribe(tier.name)}
                disabled={loading || activeTier === tier.name}
              >
                {activeTier === tier.name
                  ? 'Current Plan'
                  : tier.price === 0
                  ? 'Current'
                  : `Subscribe for $${tier.price}/mo`}
              </button>
            </div>
          ))}
        </div>

        {isSubscribed && subscription?.subscription && (
          <div className="subscription-info">
            <h3>Active Subscription</h3>
            <p>
              Expires: {new Date(subscription.subscription.subscriptionEndDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
