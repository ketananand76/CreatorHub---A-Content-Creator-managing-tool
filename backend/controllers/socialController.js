import { SocialAccount, User } from '../models/db.js';

export const getConnectedAccounts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const accounts = await SocialAccount.find({ userId });
    res.status(200).json({ success: true, accounts });
  } catch (error) {
    console.error('Get Social Accounts Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving social metrics' });
  }
};

export const syncLiveMetrics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { platform } = req.params;

    if (!['youtube', 'instagram', 'facebook'].includes(platform)) {
      return res.status(400).json({ success: false, message: 'Invalid platform specified' });
    }

    const account = await SocialAccount.findOne({ userId, platform });
    if (!account) {
      return res.status(404).json({ success: false, message: `No connected ${platform} account found` });
    }

    // 1. Calculate random small growth increments
    const growthPercent = 0.002 + Math.random() * 0.015; // 0.2% - 1.7%
    const followerIncrement = Math.max(1, Math.floor(account.followersCount * growthPercent));
    const newFollowers = account.followersCount + followerIncrement;

    // 2. Increment item metrics
    const updatedItems = (account.items || []).map(item => {
      const viewsIncrement = Math.max(10, Math.floor(item.views * (0.01 + Math.random() * 0.04)));
      const reachIncrement = Math.floor(viewsIncrement * (1.5 + Math.random() * 2));
      const likesIncrement = Math.max(1, Math.floor(viewsIncrement * (0.02 + Math.random() * 0.06)));
      const commentsIncrement = Math.max(0, Math.floor(likesIncrement * (0.05 + Math.random() * 0.1)));

      return {
        ...item,
        views: item.views + viewsIncrement,
        reach: item.reach + reachIncrement,
        likes: item.likes + likesIncrement,
        comments: item.comments + commentsIncrement
      };
    });

    const newTotalViews = updatedItems.reduce((acc, item) => acc + item.views, 0);
    const newTotalReach = updatedItems.reduce((acc, item) => acc + item.reach, 0);

    const updatedAccount = await SocialAccount.findOneAndUpdate(
      { userId, platform },
      {
        followersCount: newFollowers,
        totalViews: newTotalViews,
        totalReach: newTotalReach,
        items: updatedItems
      },
      { new: true }
    );

    // Sync to User record
    const updateData = {};
    if (platform === 'youtube') {
      updateData.youtubeSubscribers = newFollowers;
    } else if (platform === 'instagram') {
      updateData.instagramFollowers = newFollowers;
    }
    await User.findByIdAndUpdate(userId, updateData);

    res.status(200).json({
      success: true,
      message: `${platform} live metrics synced successfully!`,
      account: updatedAccount
    });
  } catch (error) {
    console.error('Sync Live Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Server error during live trace syncing' });
  }
};

export const getAdminCreatorMetrics = async (req, res) => {
  try {
    // Standard RBAC check
    if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'Access Denied: Admin access required' });
    }

    const creators = await User.find({ role: 'Creator' });
    const allMetrics = [];

    for (const creator of creators) {
      const id = creator._id || creator.id;
      const accounts = await SocialAccount.find({ userId: id });
      
      const aggregateFollowers = accounts.reduce((acc, a) => acc + a.followersCount, 0);
      const aggregateViews = accounts.reduce((acc, a) => acc + a.totalViews, 0);
      const aggregateReach = accounts.reduce((acc, a) => acc + a.totalReach, 0);

      allMetrics.push({
        creatorId: id,
        name: creator.name,
        email: creator.email,
        status: creator.status,
        accounts: accounts.map(a => ({
          platform: a.platform,
          username: a.username,
          displayName: a.displayName,
          followersCount: a.followersCount,
          totalViews: a.totalViews,
          totalReach: a.totalReach,
          itemsCount: a.items ? a.items.length : 0,
          items: a.items || []
        })),
        aggregateMetrics: {
          followers: aggregateFollowers,
          views: aggregateViews,
          reach: aggregateReach
        }
      });
    }

    res.status(200).json({ success: true, metrics: allMetrics });
  } catch (error) {
    console.error('Admin Creator Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving aggregate creator metrics' });
  }
};
