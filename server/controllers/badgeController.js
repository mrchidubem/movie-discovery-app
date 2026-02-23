const Badge = require('../models/Badge');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Review = require('../models/Review');

const BADGE_CONFIG = {
  film_critic: {
    title: 'Film Critic',
    description: 'Written 5+ movie reviews',
    icon: '✍️',
    threshold: 5,
    checkFn: 'reviews',
  },
  movie_enthusiast: {
    title: 'Movie Enthusiast',
    description: 'Added 10+ movies to favorites',
    icon: '❤️',
    threshold: 10,
    checkFn: 'favorites',
  },
  collector: {
    title: 'Collector',
    description: 'Added 20+ movies to favorites',
    icon: '🎬',
    threshold: 20,
    checkFn: 'favorites',
  },
  watchlist_master: {
    title: 'Watchlist Master',
    description: 'Added 15+ movies to watchlist',
    icon: '⏰',
    threshold: 15,
    checkFn: 'watchlist',
  },
  rating_expert: {
    title: 'Rating Expert',
    description: 'Rated 10+ movies',
    icon: '⭐',
    threshold: 10,
    checkFn: 'rated',
  },
  social_butterfly: {
    title: 'Social Butterfly',
    description: 'Has 5+ followers',
    icon: '🦋',
    threshold: 5,
    checkFn: 'followers',
  },
};

const checkAndAwardBadges = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const awardedBadges = [];

    // Count reviews
    const reviewCount = await Review.countDocuments({ userId });

    // Count favorites
    const favoriteCount = await Favorite.countDocuments({ userId });

    // Count watchlist (if model exists)
    let watchlistCount = 0;
    try {
      const Watchlist = require('../models/Watchlist');
      watchlistCount = await Watchlist.countDocuments({ userId });
    } catch (e) {
      // Watchlist model might not be imported yet
    }

    // Count ratings (reviews with ratings)
    const ratedCount = await Review.countDocuments({
      userId,
      rating: { $exists: true, $ne: null },
    });

    // Check each badge condition
    for (const [badgeType, config] of Object.entries(BADGE_CONFIG)) {
      const existingBadge = await Badge.findOne({ userId, badgeType });

      if (existingBadge) continue; // Badge already earned

      let shouldAward = false;

      switch (config.checkFn) {
        case 'reviews':
          shouldAward = reviewCount >= config.threshold;
          break;
        case 'favorites':
          shouldAward = favoriteCount >= config.threshold;
          break;
        case 'watchlist':
          shouldAward = watchlistCount >= config.threshold;
          break;
        case 'rated':
          shouldAward = ratedCount >= config.threshold;
          break;
        case 'followers':
          shouldAward = (user.followers?.length || 0) >= config.threshold;
          break;
      }

      if (shouldAward) {
        const badge = new Badge({
          userId,
          badgeType,
          title: config.title,
          description: config.description,
          icon: config.icon,
        });

        await badge.save();
        awardedBadges.push(badge);
      }
    }

    return awardedBadges;
  } catch (error) {
    console.error('Error checking badges:', error);
    return [];
  }
};

const getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;

    const badges = await Badge.find({ userId }).sort({ unlockedAt: -1 });

    res.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

const getCurrentUserBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ userId: req.user.id }).sort({
      unlockedAt: -1,
    });

    res.json(badges);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
};

module.exports = {
  checkAndAwardBadges,
  getUserBadges,
  getCurrentUserBadges,
};
