import dotenv from 'dotenv';
import { BrandDeal, TeamTask, CalendarEvent } from '../models/db.js';
dotenv.config();
// Helper to simulate Gemini or fallback generator
const generateCaptionFallback = (platform, topic, tone) => {
  const hashtags = {
    YouTube: '#shorts #viral #subscribe #creators',
    Instagram: '#trending #reels #explore #lifestyle #picoftheday',
    TikTok: '#fyp #foryou #trending #viralvideo #viral',
    Twitter: '#trending #breaking #news #thoughts'
  };

  const platformHashtags = hashtags[platform] || '#creators #viral';

  const templates = {
    professional: [
      `Excited to share my thoughts on "${topic}". In this space, consistency is everything. What's your take on this? Let me know in the comments! 🚀\n\n${platformHashtags}`,
      `Deep dive into "${topic}"! 📈 Understanding the core principles can scale your business and workflows. Read the full insights below.\n\n${platformHashtags}`
    ],
    funny: [
      `Me trying to explain "${topic}" to my friends. 💀 Tag that one friend who does this! 😂👇\n\n${platformHashtags}`,
      `Nobody: \nAbsolutely nobody: \nMe talking about "${topic}": 🤡 Volume UP! 🔊\n\n${platformHashtags}`
    ],
    educational: [
      `Here are 3 secrets about "${topic}" that you probably didn't know: \n1️⃣ The basics are key.\n2️⃣ Optimize daily.\n3️⃣ Consistency beats talent.\n\nWhich one did you find most helpful? Save this for later! 📌\n\n${platformHashtags}`,
      `Mastering "${topic}" doesn't happen overnight. Let's break down the step-by-step roadmap to get you started today. 🧵👇\n\n${platformHashtags}`
    ],
    hype: [
      `THIS IS GLOBAL! 🔥 We are breaking down everything you need to know about "${topic}". The energy is high, let's go! ⚡💥\n\n${platformHashtags}`,
      `Are you ready? 🚀 Double tap if you want to crush "${topic}" this week. Let's make it happen! 💯🌟\n\n${platformHashtags}`
    ]
  };

  const selectedTone = templates[tone] || templates.hype;
  const randomIndex = Math.floor(Math.random() * selectedTone.length);
  return selectedTone[randomIndex];
};

const generateScriptFallback = (platform, topic, duration) => {
  return `[SCENE START - ${platform.toUpperCase()} (${duration}s)]
[Visual: Energetic intro, host smiling directly at camera. Background music fading in.]
Host (Hook 0-5s): "Stop scrolling! If you are struggling with ${topic}, you need to hear this right now."

[Visual: Quick cut, overlaying text graphics: "The 3 Steps".]
Host (Body 5-25s): "Here's the problem: most creators overcomplicate it. But it boils down to three simple pillars. First, focus. Second, audit your stats. Third, refine your hook."

[Visual: B-roll showing CreatorHub dashboard analytics.]
Host (Value 25-50s): "When I started optimizing my content, my views doubled in just 14 days. That's why I use CreatorHub to coordinate all my projects and brand campaigns."

[Visual: Outro card with CreatorHub logo and call to action.]
Host (CTA 50-60s): "Check out the link in my bio to start managing your brand deals like a pro. Drop a comment with your biggest content bottleneck!"
[SCENE END]`;
};

const generateViralSuggestionsFallback = (niche) => {
  const niches = {
    tech: [
      { title: 'The TRUTH About AI Tools in 2026', hook: 'Most AI tools are a waste of time, except these...', angle: 'Controversy/Tech trend' },
      { title: 'My $10,000 Desk Setup Makeover', hook: 'I spent $10k on my setup and it changed my productivity forever.', angle: 'Aesthetic/Transformation' },
      { title: 'Coding a SaaS in 24 Hours (Real Outcome)', hook: 'No sleep, pure coffee. Here is what happened.', angle: 'Challenge/Reality' }
    ],
    finance: [
      { title: 'How I Make $5,000/Month Passive Income', hook: 'Passive income is a lie, unless you follow this 3-step formula...', angle: 'Wealth/Desire' },
      { title: 'The Global Financial Crisis Nobody is Talking About', hook: 'This indicator just hit a 10-year high. Here is what you should do.', angle: 'Fear/Urgency' },
      { title: 'I Spent Like a Millionaire for 7 Days', hook: 'This experiment changed how I view money.', angle: 'Lifestyle/Experiment' }
    ],
    lifestyle: [
      { title: 'My 5 AM Morning Routine for High Performers', hook: 'I woke up at 5 AM for a month, and here is how my life changed.', angle: 'Habit/Aspirational' },
      { title: 'Decluttering My Entire House in 10 Minutes', hook: 'This minimalist method cleared my mind in minutes.', angle: 'Satisfying/Clean' },
      { title: 'What I Eat in a Day as a Content Creator', hook: 'Healthy, fast, and under $15.', angle: 'Food/Aesthetic' }
    ]
  };

  const selectedSuggestions = niches[niche.toLowerCase()] || [
    { title: `3 Secrets to Explode on ${niche} Today`, hook: 'The algorithm changed again. Here is the new hack...', angle: 'Educational/Algorithm' },
    { title: `The Worst Mistakes Creators Make in ${niche}`, hook: 'If you are doing this, you are killing your reach.', angle: 'Warning/Value' },
    { title: `From 0 to 10k Followers: The ${niche} Blueprint`, hook: 'I built a brand in 30 days. This is the exact roadmap.', angle: 'Roadmap/Success' }
  ];

  return selectedSuggestions;
};

// Main controllers
export const generateCaption = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!req.user.isPremium && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This is a premium feature. Please upgrade your subscription to unlock AI tools.'
      });
    }

    const { platform, topic, tone } = req.body;
    if (!platform || !topic || !tone) {
      return res.status(400).json({ success: false, message: 'Platform, topic, and tone are required' });
    }

    // Call Gemini API if API Key is configured
    let resultText = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate a premium highly-engaging social media caption for ${platform} about the topic "${topic}" with a ${tone} tone. Return ONLY the caption text and relevant hashtags. No extra conversational text.` }]
            }]
          })
        });
        const data = await response.json();
        resultText = data.candidates[0].content.parts[0].text;
      } catch (err) {
        console.error('Gemini API call failed, using fallback:', err);
        resultText = generateCaptionFallback(platform, topic, tone);
      }
    } else {
      resultText = generateCaptionFallback(platform, topic, tone);
    }

    res.status(200).json({ success: true, text: resultText });
  } catch (error) {
    console.error('AI Caption Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const generateScript = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!req.user.isPremium && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This is a premium feature. Please upgrade your subscription to unlock AI tools.'
      });
    }

    const { platform, topic, duration } = req.body;
    if (!platform || !topic || !duration) {
      return res.status(400).json({ success: false, message: 'Platform, topic, and duration are required' });
    }

    let resultText = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Write a high-retention video script for ${platform} (approx ${duration} seconds) about "${topic}". Structure it with Hook, Body, and Call to Action (CTA). Include scene descriptions in brackets. Return ONLY the script.` }]
            }]
          })
        });
        const data = await response.json();
        resultText = data.candidates[0].content.parts[0].text;
      } catch (err) {
        console.error('Gemini API call failed, using fallback:', err);
        resultText = generateScriptFallback(platform, topic, duration);
      }
    } else {
      resultText = generateScriptFallback(platform, topic, duration);
    }

    res.status(200).json({ success: true, text: resultText });
  } catch (error) {
    console.error('AI Script Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const generateViralSuggestions = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!req.user.isPremium && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This is a premium feature. Please upgrade your subscription to unlock AI tools.'
      });
    }

    const { niche } = req.body;
    if (!niche) {
      return res.status(400).json({ success: false, message: 'Niche / topic focus is required' });
    }

    let suggestions = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Generate exactly 3 viral content ideas/suggestions for a creator in the "${niche}" niche. Return in valid JSON array format, where each object has fields: "title" (video title), "hook" (the opening hook line), and "angle" (psychological triggers or production angle). Return ONLY the raw JSON string.` }]
            }]
          })
        });
        const data = await response.json();
        const rawJsonText = data.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
        suggestions = JSON.parse(rawJsonText);
      } catch (err) {
        console.error('Gemini API call failed, using fallback:', err);
        suggestions = generateViralSuggestionsFallback(niche);
      }
    } else {
      suggestions = generateViralSuggestionsFallback(niche);
    }

    res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getUserAIPerformanceInsight = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'Super Admin';
    if (!req.user.isPremium && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This is a premium feature. Please upgrade your subscription to unlock AI tools.'
      });
    }

    const creatorId = req.user._id || req.user.id;
    const deals = await BrandDeal.find({ creatorId });
    const tasks = await TeamTask.find({ creatorId });
    const events = await CalendarEvent.find({ creatorId });

    const dealsValue = deals.reduce((sum, d) => sum + (Number(d.dealValue) || 0), 0);
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    
    const prompt = `You are a CreatorHub AI Assistant.
Analyze the following performance metrics for a creator:
- Total Brand Deals: ${deals.length} (Total Value: ₹${dealsValue})
- Team Tasks Completed: ${tasksCompleted} out of ${tasks.length}
- Scheduled Content Events: ${events.length}

Provide a short, motivating, and actionable 3-point markdown insight on how they can improve their content strategy and workflow.`;

    let insightText = '';
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
          insightText = data.candidates[0].content.parts[0].text;
        } else {
          throw new Error('Invalid Gemini API response');
        }
      } catch (err) {
        console.error('Gemini API call failed, using fallback:', err);
        insightText = `### 🚀 Performance Insight\n\n1. **Focus on High-Value Deals**: You have ₹${dealsValue} in pipeline.\n2. **Stay on Top of Tasks**: Complete your remaining ${tasks.length - tasksCompleted} tasks.\n3. **Consistent Posting**: Keep up with your ${events.length} scheduled events!`;
      }
    } else {
      insightText = `### 🚀 Performance Insight\n\n1. **Focus on High-Value Deals**: You have ₹${dealsValue} in pipeline.\n2. **Stay on Top of Tasks**: Complete your remaining ${tasks.length - tasksCompleted} tasks.\n3. **Consistent Posting**: Keep up with your ${events.length} scheduled events!`;
    }

    res.status(200).json({ success: true, insight: insightText });
  } catch (error) {
    console.error('AI Insight Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
