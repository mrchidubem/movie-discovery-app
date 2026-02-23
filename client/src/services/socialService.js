import api from './api';

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/api/social/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const followUser = async (userToFollowId) => {
  try {
    const response = await api.post(`/api/social/follow/${userToFollowId}`);
    return response.data;
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

export const unfollowUser = async (userToUnfollowId) => {
  try {
    const response = await api.post(`/api/social/unfollow/${userToUnfollowId}`);
    return response.data;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

export const checkIsFollowing = async (userToCheckId) => {
  try {
    const response = await api.get(`/api/social/following/${userToCheckId}`);
    return response.data.following;
  } catch (error) {
    console.error('Error checking follow status:', error);
    throw error;
  }
};

export const getFollowingFeed = async (limit = 20, skip = 0) => {
  try {
    const response = await api.get(`/api/social/feed?limit=${limit}&skip=${skip}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }
};
