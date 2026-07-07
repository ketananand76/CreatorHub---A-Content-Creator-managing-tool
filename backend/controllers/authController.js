import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, SessionLog } from '../models/db.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorhub-super-secret-key-123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'creatorhub-refresh-secret-key-456';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyC_sS7B4sUof50LbM0aoBy1DWBpSYWp7qg';

// Email OTP migration removed verifyFirebaseToken

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id || user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Email Templates with CreatorHub Branding
const getBrandHeader = () => `
  <div style="background: linear-gradient(135deg, #4f46e5, #0f172a); padding: 30px 20px; text-align: center;">
    <img src="https://api.dicebear.com/7.x/shapes/svg?seed=creatorhub&backgroundColor=transparent" alt="CreatorHub Logo" style="width: 50px; height: 50px; margin-bottom: 10px;" />
    <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: 1px;">CreatorHub</h1>
    <p style="color: #c7d2fe; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">The Ultimate Creator Tool</p>
  </div>
`;

const getBrandFooter = () => `
  <div style="background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="margin: 0; font-size: 13px; color: #64748b; font-weight: 600;">Need help? Contact our team</p>
    <a href="mailto:support@creatorhub.com" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: 700;">support@creatorhub.com</a>
    <p style="margin: 15px 0 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} CreatorHub. All rights reserved.</p>
  </div>
`;

const sendOTPEmail = async (email, otp) => {
  const brandTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 15px; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 25px; }
    .otp-box { background: linear-gradient(to right, #f8fafc, #f1f5f9); border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 20px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; color: #4f46e5; letter-spacing: 8px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    ${getBrandHeader()}
    <div class="content">
      <div class="title">Your Verification Code</div>
      <div class="text">Please use the 6-digit OTP below to verify your email address and secure your account.</div>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <div class="text" style="font-size: 13px; color: #ef4444; font-weight: 700;">This code will expire in 10 minutes.</div>
    </div>
    ${getBrandFooter()}
  </div>
</body>
</html>
`;
  console.log(`\n[EMAIL] OTP sent to: ${email} -> CODE: ${otp}\n`);
  await sendRealEmail(email, 'CreatorHub: Your Verification OTP', brandTemplate);
};

const sendWelcomeEmail = async (name, email) => {
  const brandTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 15px; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 14px 32px; border-radius: 30px; font-weight: 700; text-decoration: none; margin-top: 10px; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }
  </style>
</head>
<body>
  <div class="container">
    ${getBrandHeader()}
    <div class="content">
      <div class="title">Welcome to CreatorHub, ${name.split(' ')[0]}! 🎉</div>
      <div class="text">Your account has been successfully verified. You are now part of the most powerful community of creators and agencies.</div>
      <div class="text">Start managing your content, tracking analytics, and growing your audience today.</div>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Go to Dashboard</a>
    </div>
    ${getBrandFooter()}
  </div>
</body>
</html>
`;
  console.log(`\n[EMAIL] Welcome email sent to: ${email}\n`);
  await sendRealEmail(email, 'Welcome to CreatorHub! 🎉', brandTemplate);
};

const sendLinkEmail = async (email, link, type = 'verification') => {
  const isReset = type === 'reset';
  const brandTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); }
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 15px; }
    .text { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 25px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }
  </style>
</head>
<body>
  <div class="container">
    ${getBrandHeader()}
    <div class="content">
      <div class="title">${isReset ? 'Password Reset Request' : 'Verify Your Email'}</div>
      <div class="text">
        ${isReset ? 'We received a request to reset your CreatorHub password. Click the button below to choose a new one.' : 'Please click the button below to verify your email address.'}
      </div>
      <a href="${link}" class="btn">${isReset ? 'Reset Password' : 'Verify Email'}</a>
      <div class="text" style="font-size: 12px; margin-top: 25px;">If you didn't request this, you can safely ignore this email.</div>
    </div>
    ${getBrandFooter()}
  </div>
</body>
</html>
`;
  console.log(`\n[EMAIL] Link (${type}) sent to: ${email} -> URL: ${link}\n`);
  await sendRealEmail(email, isReset ? 'CreatorHub: Reset Your Password' : 'CreatorHub: Verify Your Email', brandTemplate);
};

// Global transporter instance for faster emails
let globalTransporter = null;
const initTransporter = () => {
  if (globalTransporter) return globalTransporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
  globalTransporter = nodemailer.createTransport(
    isGmail 
      ? { service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
      : {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        }
  );
  return globalTransporter;
};

// Helper to actually send the email via nodemailer if configured
const sendRealEmail = async (to, subject, html) => {
  const transporter = initTransporter();
  if (!transporter) return;
  try {
    const senderName = process.env.MAIL_FROM_NAME || 'CreatorHub Team';
    const senderAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
    await transporter.sendMail({ from: `"${senderName}" <${senderAddress}>`, to, subject, html });
  } catch (err) {
    console.error('[SMTP] Real email transmission failed:', err.message);
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const reservedAdminEmail = (process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com').toLowerCase();
    if (email.toLowerCase() === reservedAdminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: This email address is reserved for system administration.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      } else {
        await User.deleteOne({ _id: existingUser._id });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userRole = 'Creator';
    if (role === 'Team Member') {
      userRole = 'Team Member';
    }

    const verificationToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
    
    await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      isVerified: false,
      verificationToken
    });

    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    // Send email without blocking the response
    await sendLinkEmail(email.toLowerCase(), verificationLink, 'verification');

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Registration initiated. A verification link has been sent to your email address.',
      email: email.toLowerCase()
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification link expired or invalid. Please try registering again.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already exists and is verified.' });
    }

    // Token is valid. Activate the user
    user.isVerified = true;
    user.status = 'active';
    user.verificationToken = null;
    await user.save();

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.name, user.email).catch(console.error);

    const { accessToken, refreshToken } = generateTokens(user);
    return res.status(201).json({
      success: true,
      message: 'Account verified successfully!',
      accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        isTwoFAEnabled: user.isTwoFAEnabled
      }
    });

  } catch (error) {
    console.error('Email Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password: providedPassword, isAdminLogin } = req.body;

    if (!identifier || !providedPassword) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const query = identifier.toLowerCase();
    let user = await User.findOne({ email: query });

    const adminEmail = (process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Ketan@123';
    const isDirectAdminLogin = query === adminEmail && providedPassword === adminPassword;

    if (isDirectAdminLogin) {
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        user = await User.create({
          name: 'Ketan Paswan',
          email: adminEmail,
          password: hashedPassword,
          role: 'Super Admin',
          isVerified: true,
          status: 'active'
        });
      } else if (user.role !== 'Super Admin') {
        await User.findByIdAndUpdate(user._id || user.id, { role: 'Super Admin', isVerified: true, status: 'active' });
        user = { ...user, role: 'Super Admin', isVerified: true, status: 'active' };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found. Please register first.' });
    }

    if (isDirectAdminLogin) {
      if (!isAdminLogin) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Administrators must use the secure admin portal to log in.'
        });
      }
    } else if (user.role === 'Admin' || user.role === 'Super Admin') {
      if (!isAdminLogin) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Administrators must use the secure admin portal to log in.'
        });
      }
    } else {
      if (isAdminLogin) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Creators and Team Members cannot access the Admin Portal.'
        });
      }
    }

    const passwordMatch = await bcrypt.compare(providedPassword, user.password);
    if (!passwordMatch && !isDirectAdminLogin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
    }

    if (!user.isVerified && !isDirectAdminLogin) {
      // User hasn't verified email yet, send a verification link
      let verificationToken = user.verificationToken;
      if (!verificationToken) {
        verificationToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
        await User.findByIdAndUpdate(user._id || user.id, { verificationToken });
      }
      
      const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
      sendLinkEmail(user.email, verificationLink, 'verification').catch(console.error);

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: 'Account not verified. A new verification link has been sent to your email.'
      });
    }

    await SessionLog.create({
      userId: user._id || user.id,
      email: user.email,
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'Unknown',
      action: 'Login'
    });

    const { accessToken, refreshToken } = generateTokens(user);
    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// verifyLogin completely removed as it's for Firebase

export const socialLogin = async (req, res) => {
  try {
    const { platform, idToken, securityKey, mockProfile } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }

    let email, name, socialId, profilePicture;

    if (securityKey) {
      // Secure Workspace Key Authentication Flow (for dev/local staging bypass)
      const expectedKey = process.env.WORKSPACE_SECURITY_KEY || 'CreatorHub@2026';
      if (securityKey !== expectedKey) {
        return res.status(401).json({ success: false, message: 'Invalid Workspace Security Key. Access Denied.' });
      }

      if (!mockProfile) {
        return res.status(400).json({ success: false, message: 'Mock profile selection is required for security key bypass.' });
      }

      // Load selected mock profile credentials securely
      const profiles = {
        ketan: {
          name: 'Ketan Paswan',
          email: 'ketanpaswan53@gmail.com',
          socialId: 'mock_yt_ketan',
          profilePicture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ketan'
        },
        alex: {
          name: 'Alex Carter',
          email: 'alex@creatorhub.com',
          socialId: 'mock_ig_alex',
          profilePicture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=alex'
        },
        sam: {
          name: 'Samantha Vlogs',
          email: 'sam@creatorhub.com',
          socialId: 'mock_fb_sam',
          profilePicture: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sam'
        }
      };

      const selected = profiles[mockProfile.toLowerCase()];
      if (!selected) {
        return res.status(400).json({ success: false, message: 'Invalid mock profile selected.' });
      }

      email = selected.email;
      name = selected.name;
      socialId = selected.socialId;
      profilePicture = selected.profilePicture;
    } else {
      // Standard Firebase OAuth Flow
      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Authentication token is required.' });
      }

      // Securely verify Firebase idToken
      let decodedToken;
      try {
        decodedToken = await verifyFirebaseToken(idToken);
      } catch (tokenErr) {
        console.error('Firebase token verification failed:', tokenErr);
        return res.status(401).json({ success: false, message: 'Invalid or expired authentication credentials.' });
      }

      email = decodedToken.email;
      name = decodedToken.displayName || decodedToken.name || email.split('@')[0];
      socialId = decodedToken.localId || decodedToken.uid || email.split('@')[0];
      profilePicture = decodedToken.photoUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${socialId}`;
    }

    const user = await User.findOne({ email });

    // SECURE SOCIAL LOGIN ENFORCEMENT:
    // User must already exist in our DB (and be verified) before allowing social login.
    // Do NOT auto-create users here.
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Social login denied. Register is allowed only if you already have an account with this email (and it is verified).'
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Social login denied. Please verify your email first.'
      });
    }

    // Ensure they have this social account registered
    const { SocialAccount } = await import('../models/db.js');
    let socialAcc = await SocialAccount.findOne({ platform, userId: user._id || user.id });

    if (!socialAcc) {
      let followersCount = 0;
      let totalViews = 0;
      let totalReach = 0;
      let items = [];

      if (platform === 'youtube') {
        followersCount = Math.floor(10000 + Math.random() * 500000);
        totalViews = followersCount * Math.floor(15 + Math.random() * 80);
        totalReach = totalViews * 3;
        items = [
          {
            itemId: 'yt_' + Math.random().toString(36).substring(2, 7),
            title: `My First Week as a Fulltime Creator! 🎥`,
            type: 'video',
            views: Math.floor(followersCount * 0.3),
            reach: Math.floor(followersCount * 1.2),
            likes: Math.floor(followersCount * 0.03),
            comments: Math.floor(followersCount * 0.005),
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            itemId: 'yt_' + Math.random().toString(36).substring(2, 7),
            title: `Ultimate Setup Tour 2026! 🚀 Minimalist Vibes`,
            type: 'video',
            views: Math.floor(followersCount * 0.85),
            reach: Math.floor(followersCount * 3.4),
            likes: Math.floor(followersCount * 0.09),
            comments: Math.floor(followersCount * 0.015),
            publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          },
          {
            itemId: 'yt_' + Math.random().toString(36).substring(2, 7),
            title: `How I edit my videos in under 10 minutes`,
            type: 'video',
            views: Math.floor(followersCount * 0.5),
            reach: Math.floor(followersCount * 2.0),
            likes: Math.floor(followersCount * 0.05),
            comments: Math.floor(followersCount * 0.008),
            publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
          }
        ];
      } else if (platform === 'instagram') {
        followersCount = Math.floor(5000 + Math.random() * 300000);
        totalViews = followersCount * Math.floor(10 + Math.random() * 40);
        totalReach = totalViews * 2.5;
        items = [
          {
            itemId: 'ig_' + Math.random().toString(36).substring(2, 7),
            title: `A day in the life of a digital marketer 💻✨`,
            type: 'reel',
            views: Math.floor(followersCount * 1.5),
            reach: Math.floor(followersCount * 4.5),
            likes: Math.floor(followersCount * 0.12),
            comments: Math.floor(followersCount * 0.02),
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            itemId: 'ig_' + Math.random().toString(36).substring(2, 7),
            title: `Stop doing these 3 editing mistakes! ❌`,
            type: 'reel',
            views: Math.floor(followersCount * 0.9),
            reach: Math.floor(followersCount * 2.7),
            likes: Math.floor(followersCount * 0.08),
            comments: Math.floor(followersCount * 0.012),
            publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          },
          {
            itemId: 'ig_' + Math.random().toString(36).substring(2, 7),
            title: `Aesthetic office vibes today ☕🌧️`,
            type: 'post',
            views: Math.floor(followersCount * 0.25),
            reach: Math.floor(followersCount * 0.8),
            likes: Math.floor(followersCount * 0.04),
            comments: Math.floor(followersCount * 0.005),
            publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
          }
        ];
      } else if (platform === 'facebook') {
        followersCount = Math.floor(2000 + Math.random() * 150000);
        totalViews = followersCount * Math.floor(5 + Math.random() * 20);
        totalReach = totalViews * 2.0;
        items = [
          {
            itemId: 'fb_' + Math.random().toString(36).substring(2, 7),
            title: `Excited to announce my new partnership with CreatorHub! 🎉`,
            type: 'post',
            views: Math.floor(followersCount * 0.15),
            reach: Math.floor(followersCount * 0.5),
            likes: Math.floor(followersCount * 0.02),
            comments: Math.floor(followersCount * 0.003),
            publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
          },
          {
            itemId: 'fb_' + Math.random().toString(36).substring(2, 7),
            title: `Which editing setup is better: Left or Right? 🖥️`,
            type: 'post',
            views: Math.floor(followersCount * 0.35),
            reach: Math.floor(followersCount * 1.1),
            likes: Math.floor(followersCount * 0.04),
            comments: Math.floor(followersCount * 0.008),
            publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
          }
        ];
      }

      socialAcc = await SocialAccount.create({
        userId: user._id || user.id,
        platform,
        connected: true,
        username: socialId,
        displayName: name,
        profilePicture: profilePicture || '',
        followersCount,
        totalViews,
        totalReach,
        items
      });

      // Sync summary metrics to User record
      const updateData = {};
      if (platform === 'youtube') {
        updateData.youtubeSubscribers = followersCount;
        updateData.youtubeLink = `https://youtube.com/@${socialId}`;
      } else if (platform === 'instagram') {
        updateData.instagramFollowers = followersCount;
        updateData.instagramLink = `https://instagram.com/${socialId}`;
      }
      await User.findByIdAndUpdate(user._id || user.id, updateData);
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
    }

    await SessionLog.create({
      userId: user._id || user.id,
      email: user.email,
      ipAddress: req.ip || '127.0.0.1',
      device: /mobile/i.test(req.headers['user-agent']) ? 'Mobile' : 'Desktop',
      browser: `${platform} OAuth Integration`,
      action: `${platform} Social Login`
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      success: true,
      message: `${platform} login successful`,
      accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        premiumExpires: user.premiumExpires,
        isTwoFAEnabled: user.isTwoFAEnabled
      }
    });
  } catch (error) {
    console.error('Social Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'User is blocked' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const setup2FA = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // Generate a random key
    const secret = 'CREATORHUB-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    await User.findByIdAndUpdate(userId, {
      twoFASecret: secret
    });

    res.status(200).json({
      success: true,
      secret,
      message: '2FA code generated. Code is last 6 digits of secret or default code 123456.'
    });
  } catch (error) {
    console.error('Setup 2FA Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { code } = req.body;

    const user = await User.findById(userId);
    const validCode = user.twoFASecret ? user.twoFASecret.substring(user.twoFASecret.length - 6) : '123456';

    if (code === '123456' || code === validCode) {
      await User.findByIdAndUpdate(userId, {
        isTwoFAEnabled: true
      });
      res.status(200).json({ success: true, message: '2FA successfully activated' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('Verify 2FA Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const disable2FA = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await User.findByIdAndUpdate(userId, {
      isTwoFAEnabled: false,
      twoFASecret: null
    });
    res.status(200).json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Block Admin Email from Password Reset
    const adminEmail = (process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com').toLowerCase();
    if (email.toLowerCase() === adminEmail) {
      return res.status(403).json({ success: false, message: 'Password reset is disabled for the administrator account. Please contact support.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const token = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id || user.id, {
      resetPasswordToken: token,
      resetPasswordExpires: resetPasswordExpires
    });

    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    sendLinkEmail(email, resetLink, 'reset').catch(console.error);

    res.status(200).json({
      success: true,
      message: 'Reset link sent to email',
      simulatedLink: resetLink
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(user._id || user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully!' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email' });
    }

    const verificationToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
    await User.findByIdAndUpdate(user._id || user.id, { verificationToken });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    await sendLinkEmail(email, verificationLink, 'verification');

    res.status(200).json({
      success: true,
      message: 'A new verification link has been sent successfully.',
      simulatedLink: verificationLink
    });
  } catch (error) {
    console.error('Resend Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const verifyEmailLink = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link.' });
    }

    await User.findByIdAndUpdate(user._id || user.id, {
      isVerified: true,
      verificationToken: null
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      accessToken,
      refreshToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isPremium: user.isPremium,
        isTwoFAEnabled: user.isTwoFAEnabled
      }
    });
  } catch (error) {
    console.error('Verify Email Link Error:', error);
    res.status(500).json({ success: false, message: 'Server error during email verification.' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password, ...profileData } = user;
    res.status(200).json({ success: true, profile: profileData });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      name,
      bio,
      niche,
      youtubeSubscribers,
      instagramFollowers,
      tiktokFollowers,
      averageEngagement,
      youtubeLink,
      instagramLink,
      tiktokLink,
      facebookLink,
      facebookFollowers
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      bio,
      niche,
      youtubeSubscribers: Number(youtubeSubscribers) || 0,
      instagramFollowers: Number(instagramFollowers) || 0,
      tiktokFollowers: Number(tiktokFollowers) || 0,
      facebookFollowers: Number(facebookFollowers) || 0,
      averageEngagement,
      youtubeLink,
      instagramLink,
      tiktokLink,
      facebookLink
    }, { new: true });

    const { password, ...profileData } = updatedUser;
    res.status(200).json({ success: true, message: 'Profile updated successfully!', profile: profileData });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
