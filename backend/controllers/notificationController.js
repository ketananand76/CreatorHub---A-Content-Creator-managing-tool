import { Notification, User } from '../models/db.js';

export const getUserNotifications = async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    
    // Check if user is a Creator and has a premium subscription
    if (req.user.role === 'Creator' && req.user.isPremium && req.user.premiumExpires) {
      const expires = new Date(req.user.premiumExpires);
      const now = new Date();
      const diffMs = expires.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMs <= 0) {
        // Subscription already expired!
        await User.findByIdAndUpdate(userId, { isPremium: false });
        
        // Alert notification (if not already created)
        const expiredNoticeKey = `sub-expired-${userId}`;
        const existing = await Notification.findOne({ userId, title: 'Subscription Expired' });
        if (!existing) {
          await Notification.create({
            userId,
            title: 'Subscription Expired',
            message: 'Your premium subscription has expired. Please upgrade or renew your payment to access premium AI features.',
            type: 'subscription'
          });
        }
        
        // Update request user object for current request session
        req.user.isPremium = false;
      } else if (diffDays <= 7) {
        // Expiring in less than 7 days!
        const expiringNoticeTitle = 'Subscription Expiring Soon';
        const existing = await Notification.findOne({ userId, title: expiringNoticeTitle });
        if (!existing) {
          await Notification.create({
            userId,
            title: expiringNoticeTitle,
            message: `Your premium subscription will expire in ${diffDays} day${diffDays > 1 ? 's' : ''} on ${expires.toLocaleDateString()}. Please renew it to prevent service interruption.`,
            type: 'subscription'
          });
        }
      }
    }

    // Find all notifications matching user ID or broadcast for 'all'
    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { userId: 'all' }
      ]
    });

    // Annotate isRead status for broadcasts vs direct alerts
    const annotated = notifications.map(n => {
      let isRead = n.isRead;
      if (n.userId === 'all') {
        isRead = Array.isArray(n.isReadBy) && n.isReadBy.includes(userId);
      }
      return {
        id: n._id || n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead,
        createdAt: n.createdAt
      };
    });

    // Sort descending by date
    const sorted = annotated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, notifications: sorted });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.user._id || req.user.id);

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.userId === 'all') {
      // Add user to read list if not already there
      const readSet = new Set(notification.isReadBy || []);
      readSet.add(userId);
      await Notification.findByIdAndUpdate(id, { isReadBy: Array.from(readSet) });
    } else {
      if (String(notification.userId) !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createBroadcastNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const broadcast = await Notification.create({
      userId: 'all',
      title,
      message,
      type: 'broadcast',
      isReadBy: []
    });

    res.status(201).json({ success: true, message: 'Broadcast notification published successfully', broadcast });
  } catch (error) {
    console.error('Create Broadcast Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
