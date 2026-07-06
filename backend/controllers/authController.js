import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, SessionLog } from '../models/db.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorhub-super-secret-key-123';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'creatorhub-refresh-secret-key-456';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyC_sS7B4sUof50LbM0aoBy1DWBpSYWp7qg';

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

// Transactional email sender with a more trustworthy password-reset/verification template
const sendOTPEmail = async (email, otp) => {
  const brandTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f5f7fb; color: #0f172a; margin: 0; padding: 0; }
    .email-container { max-width: 560px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #0f172a); padding: 28px 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { color: #c7d2fe; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; }
    .content { padding: 32px 28px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 10px; }
    .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 22px; }
    .otp-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; display: inline-block; min-width: 220px; margin: 8px auto 12px; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 30px; font-weight: 800; color: #111827; letter-spacing: 6px; }
    .expiry { font-size: 11px; color: #ef4444; font-weight: 700; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .footer { background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    .footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">CreatorHub</div>
      <div class="subtitle">Secure Account Verification</div>
    </div>
    <div class="content">
      <div class="title">Use this code to continue</div>
      <div class="text">
        We received a request to verify your account or reset your password. Enter the 6-digit code below to continue.
      </div>
      <div class="otp-card">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Valid for 10 minutes</div>
      </div>
      <div class="text" style="margin-top: 16px; font-size: 12px; color: #64748b;">
        If you did not request this, you can safely ignore this email. Your account remains secure.
      </div>
    </div>
    <div class="footer">
      <div>Need help? Contact support at support@creatorhub.com</div>
    </div>
  </div>
</body>
</html>
`;

  console.log('========================================================================');
  console.log(`[EMAIL SEND SIMULATOR] To: ${email}`);
  console.log(`[BRAND OTP CODE]: ${otp}`);
  console.log('------------------------------------------------------------------------');
  console.log(brandTemplate);
  console.log('========================================================================');

  // Send real email if SMTP credentials are provided in .env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
      const transporter = nodemailer.createTransport(
        isGmail 
          ? {
              service: 'gmail',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            }
          : {
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT) || 465,
              secure: Number(process.env.SMTP_PORT) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            }
      );

      const senderName = process.env.MAIL_FROM_NAME || 'CreatorHub Team';
      const senderAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;

      await transporter.sendMail({
        from: `"${senderName}" <${senderAddress}>`,
        to: email,
        subject: 'CreatorHub security code: verify your account',
        html: brandTemplate,
        headers: {
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal'
        }
      });
      console.log(`[SMTP] Real verification email sent successfully to: ${email}`);
    } catch (err) {
      console.error('[SMTP] Real email transmission failed:', err.message);
    }
  }
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
    body { font-family: Arial, Helvetica, sans-serif; background-color: #f5f7fb; color: #0f172a; margin: 0; padding: 0; }
    .email-container { max-width: 560px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5, #0f172a); padding: 28px 24px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .subtitle { color: #c7d2fe; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; }
    .content { padding: 32px 28px; text-align: center; }
    .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 10px; }
    .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 22px; }
    .action-btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 14px 30px; border-radius: 10px; font-size: 13px; margin: 10px auto 20px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2); }
    .footer { background-color: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
    .footer a { color: #4f46e5; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">CreatorHub</div>
      <div class="subtitle">${isReset ? 'Password Reset Security' : 'Secure Account Verification'}</div>
    </div>
    <div class="content">
      <div class="title">${isReset ? 'Reset Your Password' : 'Confirm Your Account'}</div>
      <div class="text">
        ${isReset 
          ? 'We received a request to reset your password. Click the secure button below to choose a new password.' 
          : 'Thank you for registering at CreatorHub. To active your workspace account, please verify your email address by clicking the button below.'
        }
      </div>
      <div>
        <a href="${link}" class="action-btn" target="_blank">${isReset ? 'Reset Password' : 'Verify Email Address'}</a>
      </div>
      <div class="text" style="margin-top: 16px; font-size: 12px; color: #64748b;">
        If the button above does not work, copy and paste this URL into your browser:<br/>
        <a href="${link}" style="color: #4f46e5; word-break: break-all;">${link}</a>
      </div>
      <div class="text" style="margin-top: 16px; font-size: 12px; color: #64748b;">
        If you did not request this, you can safely ignore this email. Your account remains secure.
      </div>
    </div>
    <div class="footer">
      <div>Need help? Contact support at support@creatorhub.com</div>
    </div>
  </div>
</body>
</html>
  `;

  console.log('========================================================================');
  console.log(`[EMAIL SEND SIMULATOR] To: ${email}`);
  console.log(`[SECURITY LINK]: ${link}`);
  console.log('------------------------------------------------------------------------');
  console.log(brandTemplate);
  console.log('========================================================================');

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
      const transporter = nodemailer.createTransport(
        isGmail 
          ? {
              service: 'gmail',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            }
          : {
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT) || 465,
              secure: Number(process.env.SMTP_PORT) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
              }
            }
      );

      const senderName = process.env.MAIL_FROM_NAME || 'CreatorHub Team';
      const senderAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;

      await transporter.sendMail({
        from: `"${senderName}" <${senderAddress}>`,
        to: email,
        subject: isReset ? 'CreatorHub: Reset Your Password' : 'CreatorHub: Verify Your Email Address',
        html: brandTemplate,
      });
      console.log(`[SMTP] Real link email sent successfully to: ${email}`);
    } catch (err) {
      console.error('[SMTP] Real email link transmission failed:', err.message);
    }
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
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userRole = 'Creator';
    if (role === 'Team Member') {
      userRole = 'Team Member';
    }

    const verificationToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      isVerified: false,
      verificationToken,
      status: 'active'
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    
    await sendLinkEmail(email, verificationLink, 'verification');

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Registration successful. A verification link has been sent to your inbox.',
      email: newUser.email,
      simulatedLink: verificationLink
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    if (user.isVerified) {
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
    } else {
      res.status(200).json({
        success: false,
        message: 'Email has not been verified yet. Please click the link in your inbox.'
      });
    }
  } catch (error) {
    console.error('Verification Check Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email: providedEmail, password: providedPassword, isAdminLogin } = req.body;

    if (!providedEmail || !providedPassword) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const email = providedEmail.toLowerCase();
    let user = await User.findOne({ email });

    const adminEmail = (process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Ketan@123';
    const isDirectAdminLogin = email === adminEmail && providedPassword === adminPassword;

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
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
    }

    if (!user.isVerified) {
      const verificationToken = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
      user.verificationToken = verificationToken;
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
      await sendLinkEmail(user.email, verificationLink, 'verification');

      return res.status(200).json({
        success: false,
        requiresVerification: true,
        message: 'Account is not verified. A verification link has been sent to your inbox.',
        email: user.email,
        simulatedLink: verificationLink
      });
    }

    // Track Session
    const userAgent = req.headers['user-agent'] || 'Unknown Desktop';
    const ip = req.ip || '127.0.0.1';
    let device = 'Desktop';
    if (/mobile/i.test(userAgent)) device = 'Mobile';
    else if (/tablet/i.test(userAgent)) device = 'Tablet';

    let browser = 'Chrome';
    if (/firefox/i.test(userAgent)) browser = 'Firefox';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/edge/i.test(userAgent)) browser = 'Edge';

    await SessionLog.create({
      userId: user._id || user.id,
      email: user.email,
      ipAddress: ip,
      device,
      browser,
      action: 'Login'
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
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
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const socialLogin = async (req, res) => {
  try {
    const { platform, email, name, socialId, profilePicture } = req.body;

    if (!platform || !socialId || !name) {
      return res.status(400).json({ success: false, message: 'Platform, social ID, and name are required' });
    }

    const targetEmail = email ? email.toLowerCase() : `${platform}_${socialId}@creatorhub.mock`;

    let user = await User.findOne({ email: targetEmail });
    
    // Also search by name if email is generated/mock
    if (!user && targetEmail.endsWith('@creatorhub.mock')) {
      const allUsers = await User.find({ role: 'Creator' });
      user = allUsers.find(u => u.name === name);
    }

    if (!user) {
      const randPassword = Math.random().toString(36).substring(2, 15);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randPassword, salt);

      user = await User.create({
        name,
        email: targetEmail,
        password: hashedPassword,
        role: 'Creator',
        isVerified: true, // Social logins are verified immediately
        status: 'active'
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    const token = Array.from({ length: 32 }, () => Math.random().toString(36)[2] || '0').join('');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    await sendLinkEmail(email, resetLink, 'reset');

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

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

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
    user.verificationToken = verificationToken;
    await user.save();

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

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

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
      tiktokLink
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, {
      name,
      bio,
      niche,
      youtubeSubscribers: Number(youtubeSubscribers) || 0,
      instagramFollowers: Number(instagramFollowers) || 0,
      tiktokFollowers: Number(tiktokFollowers) || 0,
      averageEngagement,
      youtubeLink,
      instagramLink,
      tiktokLink
    }, { new: true });

    const { password, ...profileData } = updatedUser;
    res.status(200).json({ success: true, message: 'Profile updated successfully!', profile: profileData });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
