import { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const NotificationsPanel = ({ onClose }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg dark:bg-gray-900">
      <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
        <h2 className="text-xl font-bold">🔔 Notifications</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FaTimes size={20} />
        </button>
      </div>

      <div className="max-h-[calc(100vh-60px)] overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500">No notifications yet</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif._id}
                className={`cursor-pointer rounded-lg p-3 transition-colors ${
                  notif.read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/30'
                }`}
                onClick={() => markAsRead(notif._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{notif.type}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                    {notif.platform && (
                      <p className="mt-1 text-xs font-medium text-secondary">{notif.platform}</p>
                    )}
                  </div>
                  {!notif.read && <div className="ml-2 h-2 w-2 rounded-full bg-secondary" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
