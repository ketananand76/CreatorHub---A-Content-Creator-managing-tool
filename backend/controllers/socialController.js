import { User } from '../models/db.js';
import axios from 'axios';

// A deterministic hash function to generate consistent numbers for mocked APIs
// This ensures that refreshing the page ALWAYS returns the EXACT same numbers for a given username.
const generateConsistentNumber = (username, min, max, salt = '') => {
  let hash = 0;
  const str = username.toLowerCase() + salt;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const random = Math.abs(Math.sin(hash)) * (max - min) + min;
  return Math.floor(random);
};

export const socialLoginByHandle = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Not implemented' });
};

export const syncSocialLink = async (req, res) => {
  try {
    const { platform, link } = req.body;
    const userId = req.user._id;

    if (!platform || !link) {
      return res.status(200).json({ success: false, message: 'Platform and link are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    let updatedMetrics = {};
    const now = new Date();
    
    // Prepare the update object
    const updateData = {};
    const existingMetrics = user.socialMetrics || {};

    if (platform === 'youtube') {
      const match = link.match(/@([a-zA-Z0-9_-]+)/);
      const handle = match ? match[1] : link.split('/').pop();
      
      const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        return res.status(200).json({ success: false, message: 'YouTube API Key is missing in backend.' });
      }

      try {
        let channelId = '';
        let stats = null;

        const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${YOUTUBE_API_KEY}`);
        
        if (searchRes.data.items && searchRes.data.items.length > 0) {
          channelId = searchRes.data.items[0].snippet.channelId;
          const statsRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`);
          
          if (statsRes.data.items && statsRes.data.items.length > 0) {
            stats = statsRes.data.items[0].statistics;
            updatedMetrics = {
              channelId,
              subscribers: parseInt(stats.subscriberCount || 0),
              views: parseInt(stats.viewCount || 0),
              videos: parseInt(stats.videoCount || 0),
              lastSynced: now
            };
            
            updateData.youtubeLink = link;
            updateData.youtubeSubscribers = updatedMetrics.subscribers;
            updateData.socialMetrics = {
              ...existingMetrics,
              youtube: { ...(existingMetrics.youtube || {}), ...updatedMetrics }
            };
          }
        } else {
           return res.status(200).json({ success: false, message: 'YouTube channel not found. Please verify the link.' });
        }
      } catch (err) {
        // Hiding red console error by catching and returning 200 success false
        return res.status(200).json({ success: false, message: 'YouTube API Error. Please check your API key configuration in Google Cloud.' });
      }

    } else if (platform === 'instagram') {
      const username = link.replace(/\/$/, '').split('/').pop();
      const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
      const META_IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID;

      if (!META_ACCESS_TOKEN || !META_IG_ACCOUNT_ID) {
        return res.status(200).json({ success: false, message: 'Meta Graph API keys (META_ACCESS_TOKEN or META_IG_ACCOUNT_ID) are missing in the backend .env file. Please follow the instructions to get them.' });
      }

      try {
        const fbRes = await axios.get(`https://graph.facebook.com/v19.0/${META_IG_ACCOUNT_ID}?fields=business_discovery.username(${username}){followers_count,media_count}&access_token=${META_ACCESS_TOKEN}`);
        const data = fbRes.data.business_discovery;
        
        updatedMetrics = {
          username,
          followers: parseInt(data.followers_count || 0),
          posts: parseInt(data.media_count || 0),
          lastSynced: now
        };
        
        updateData.instagramLink = link;
        updateData.instagramFollowers = updatedMetrics.followers;
        updateData.socialMetrics = {
          ...existingMetrics,
          instagram: { ...(existingMetrics.instagram || {}), ...updatedMetrics }
        };
      } catch (err) {
        return res.status(200).json({ success: false, message: 'Failed to fetch Instagram data. Make sure the username is a public Professional/Creator account.' });
      }

    } else if (platform === 'facebook') {
      const pageId = link.replace(/\/$/, '').split('/').pop();
      const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

      if (!META_ACCESS_TOKEN) {
        return res.status(200).json({ success: false, message: 'META_ACCESS_TOKEN is missing in the backend .env file. Please follow the instructions to get it.' });
      }

      try {
        const fbRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=followers_count,fan_count&access_token=${META_ACCESS_TOKEN}`);
        const data = fbRes.data;

        updatedMetrics = {
          pageId,
          followers: parseInt(data.followers_count || data.fan_count || 0),
          likes: parseInt(data.fan_count || 0),
          lastSynced: now
        };
        
        updateData.facebookLink = link;
        updateData.facebookFollowers = updatedMetrics.followers;
        updateData.socialMetrics = {
          ...existingMetrics,
          facebook: { ...(existingMetrics.facebook || {}), ...updatedMetrics }
        };
      } catch (err) {
        return res.status(200).json({ success: false, message: 'Failed to fetch Facebook data. Ensure the Page exists and is public.' });
      }
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.status(200).json({
      success: true,
      message: `${platform} connected and synced successfully!`,
      metrics: updatedMetrics,
      socialMetrics: updateData.socialMetrics || user.socialMetrics, 
      socialLinks: {
        youtubeLink: updateData.youtubeLink ?? user.youtubeLink ?? null,
        instagramLink: updateData.instagramLink ?? user.instagramLink ?? null,
        facebookLink: updateData.facebookLink ?? user.facebookLink ?? null
      }
    });

  } catch (error) {
    res.status(200).json({ success: false, message: error.message || 'Server error while syncing social link' });
  }
};

export const disconnectSocialLink = async (req, res) => {
  try {
    const { platform } = req.body;
    const userId = req.user._id;

    if (!platform) {
      return res.status(200).json({ success: false, message: 'Platform is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(200).json({ success: false, message: 'User not found' });
    }

    // Remove the platform link and metrics
    const updateData = {
      $unset: {
        [`${platform}Link`]: 1,
        [`${platform}Subscribers`]: 1,
        [`${platform}Followers`]: 1,
        [`socialMetrics.${platform}`]: 1
      }
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: `${platform} disconnected successfully!`,
      socialMetrics: updatedUser.socialMetrics || {},
      socialLinks: {
        youtubeLink: updatedUser.youtubeLink || null,
        instagramLink: updatedUser.instagramLink || null,
        facebookLink: updatedUser.facebookLink || null
      }
    });

  } catch (error) {
    res.status(200).json({ success: false, message: error.message || 'Server error while disconnecting social link' });
  }
};
