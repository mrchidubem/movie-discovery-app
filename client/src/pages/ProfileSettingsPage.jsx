import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FaBell, FaUsers, FaCog } from 'react-icons/fa';
import './ProfileSettingsPage.css';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
};

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('email');
  const [emailSettings, setEmailSettings] = useState({
    newReleases: true,
    streamingAlerts: true,
    actorNews: true,
    recommendations: false,
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [socialProfile, setSocialProfile] = useState(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load social profile
      const socialRes = await api.get(`/api/social/profile/${user?._id}`);
      setSocialProfile(socialRes.data);
      setFollowers(socialRes.data.followers?.length || 0);
      setFollowing(socialRes.data.following?.length || 0);

      // Load push subscription status
      const pushRes = await api.get('/api/push');
      setPushEnabled(pushRes.data && pushRes.data.length > 0);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleEmailSettingChange = (setting) => {
    setEmailSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications not supported in your browser');
      return;
    }

    try {
      setLoading(true);
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        alert('Missing VAPID public key (set VITE_VAPID_PUBLIC_KEY in client env)');
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const subObject = subscription.toJSON();
        await api.post('/api/push/subscribe', {
          endpoint: subscription.endpoint,
          auth: subObject.keys.auth,
          p256dh: subObject.keys.p256dh,
          userAgent: navigator.userAgent,
        });

        setPushEnabled(true);
        alert('✅ Push notifications enabled!');
      }
    } catch (error) {
      console.error('Error enabling push:', error);
      alert('Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await api.post('/api/push/send-test');
      alert('✅ Test notification sent!');
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Failed to send test notification');
    }
  };

  return (
    <div className="profile-settings-page">
      <div className="settings-container">
        <h1>🔧 Settings & Preferences</h1>

        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            <FaBell /> Email Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === 'push' ? 'active' : ''}`}
            onClick={() => setActiveTab('push')}
          >
            <FaBell /> Push Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            <FaUsers /> Social Profile
          </button>
        </div>

        <div className="settings-content">
          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="tab-content">
              <h2>✉️ Email Notification Preferences</h2>
              <div className="settings-group">
                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailSettings.newReleases}
                      onChange={() => handleEmailSettingChange('newReleases')}
                    />
                    New Releases ({emailSettings.newReleases ? 'Enabled' : 'Disabled'})
                  </label>
                  <p>Receive email when new movies arrive in your favorite genres</p>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailSettings.streamingAlerts}
                      onChange={() => handleEmailSettingChange('streamingAlerts')}
                    />
                    Streaming Alerts ({emailSettings.streamingAlerts ? 'Enabled' : 'Disabled'})
                  </label>
                  <p>Get notified when movies arrive on your favorite platforms</p>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailSettings.actorNews}
                      onChange={() => handleEmailSettingChange('actorNews')}
                    />
                    Actor News ({emailSettings.actorNews ? 'Enabled' : 'Disabled'})
                  </label>
                  <p>Updates about actors you follow</p>
                </div>

                <div className="setting-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailSettings.recommendations}
                      onChange={() => handleEmailSettingChange('recommendations')}
                    />
                    Personalized Recommendations ({emailSettings.recommendations ? 'Enabled' : 'Disabled'})
                  </label>
                  <p>Weekly curated recommendations based on your ratings</p>
                </div>
              </div>
              <button className="save-btn">💾 Save Email Preferences</button>
            </div>
          )}

          {/* Push Settings Tab */}
          {activeTab === 'push' && (
            <div className="tab-content">
              <h2>🔔 Push Notifications</h2>
              <div className="push-status">
                {pushEnabled ? (
                  <>
                    <p className="status-enabled">✅ Push notifications enabled</p>
                    <button
                      className="test-btn"
                      onClick={handleTestNotification}
                      disabled={loading}
                    >
                      📨 Send Test Notification
                    </button>
                  </>
                ) : (
                  <>
                    <p className="status-disabled">❌ Push notifications disabled</p>
                    <button
                      className="enable-btn"
                      onClick={handleEnablePush}
                      disabled={loading}
                    >
                      {loading ? 'Enabling...' : '🔔 Enable Push Notifications'}
                    </button>
                  </>
                )}
              </div>
              <p className="info-text">
                Get instant notifications when your movies arrive on streaming platforms
              </p>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="tab-content">
              <h2>👥 Social Profile</h2>
              <div className="social-stats">
                <div className="stat-card">
                  <div className="stat-number">{followers}</div>
                  <div className="stat-label">Followers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{following}</div>
                  <div className="stat-label">Following</div>
                </div>
              </div>

              <div className="bio-section">
                <label>Bio:</label>
                <textarea
                  placeholder="Tell other users about your movie taste..."
                  defaultValue={socialProfile?.bio || ''}
                  maxLength={160}
                />
                <button className="save-btn">💾 Update Bio</button>
              </div>

              <div className="social-info">
                <p>
                  Share your movie ratings and discoveries with the community. Your activity
                  includes:
                </p>
                <ul>
                  <li>⭐ Ratings you give to movies</li>
                  <li>❤️ Movies you favorite</li>
                  <li>👥 Users you follow</li>
                  <li>🎬 Collections you create</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
