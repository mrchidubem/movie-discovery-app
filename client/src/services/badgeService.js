import api from './api';

export const getUserBadges = async (userId) => {
  try {
    const response = await api.get(`/api/badges/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }
};

export const getCurrentUserBadges = async () => {
  try {
    const response = await api.get('/api/badges');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user badges:', error);
    throw error;
  }
};
