const User = require('../models/User');
const Review = require('../models/Review');

// Get user profile (public)
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password')
      .populate('followers', 'name photoURL displayName')
      .populate('following', 'name photoURL displayName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If profile is not public and not the same user, return limited info
    if (!user.isPublic && userId !== req.user?.id) {
      return res.json({
        _id: user._id,
        name: user.name,
        displayName: user.displayName,
        photoURL: user.photoURL,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
        isPublic: false,
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Follow a user
const followUser = async (req, res) => {
  try {
    const { userToFollowId } = req.params;
    const currentUserId = req.user.id;

    if (userToFollowId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userToFollowId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollowId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(userToFollowId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const { userToUnfollowId } = req.params;
    const currentUserId = req.user.id;

    const userToUnfollow = await User.findById(userToUnfollowId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollowId
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUserId
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Check if following
const isFollowing = async (req, res) => {
  try {
    const { userToCheckId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = currentUser.following.includes(userToCheckId);
    res.json({ following });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
};

// Get user's review feed from followed users
const getFollowingFeed = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get reviews from followed users
    const reviews = await Review.find({ user: { $in: currentUser.following } })
      .populate('user', 'name displayName photoURL')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

module.exports = {
  getUserProfile,
  followUser,
  unfollowUser,
  isFollowing,
  getFollowingFeed,
};
