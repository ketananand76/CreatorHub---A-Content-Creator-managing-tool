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

const verifyFirebaseToken = async (idToken) => {
  const apiKey = FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Firebase API Key is not configured on the server.');
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Firebase token verification failed.');
  }

  if (!data.users || data.users.length === 0) {
    throw new Error('No user profile found for this token.');
  }

  return data.users[0]; // Returns { email, emailVerified, displayName, localId }
};

export const getFirebaseConfig = (req, res) => {
  res.status(200).json({
    success: true,
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    }
  });
};

export const register = async (req, res) => {
  try {
    const { idToken, name, role } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Firebase authentication token is required.' });
    }

    const decodedToken = await verifyFirebaseToken(idToken);
    const email = decodedToken.email;

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

    const randPassword = Math.random().toString(36).substring(2, 15);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randPassword, salt);

    let userRole = 'Creator';
    if (role === 'Team Member') {
      userRole = 'Team Member';
    }

    const newUser = await User.create({
      name: name || decodedToken.displayName || email.split('@')[0],
      email,
      password: hashedPassword,
      role: userRole,
      isVerified: decodedToken.emailVerified,
      status: 'active'
    });

    if (!decodedToken.emailVerified) {
      return res.status(200).json({
        success: true,
        requiresVerification: true,
        message: 'Registration successful. Please verify your email using the link sent to your inbox.',
        tempUserId: newUser._id || newUser.id
      });
    }

    const { accessToken, refreshToken } = generateTokens(newUser);

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully.',
      accessToken,
      refreshToken,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isPremium: newUser.isPremium,
        isTwoFAEnabled: newUser.isTwoFAEnabled
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Authentication token is required' });
    }

    const decodedToken = await verifyFirebaseToken(idToken);
    if (!decodedToken.emailVerified) {
      return res.status(400).json({ success: false, message: 'Your email address is not verified yet. Please check your inbox for verification link.' });
    }

    const user = await User.findOneAndUpdate(
      { email: decodedToken.email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

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
    console.error('Verification Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { idToken, isAdminLogin, email: providedEmail, password: providedPassword } = req.body;

    let decodedToken = null;
    let email = providedEmail || '';

    if (idToken) {
      decodedToken = await verifyFirebaseToken(idToken);
      email = decodedToken.email;
    } else if (providedEmail && providedPassword) {
      email = providedEmail;
    } else {
      return res.status(400).json({ success: false, message: 'Authentication token or credentials are required' });
    }

    let user = await User.findOne({ email });

    const adminEmail = (process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Ketan@123';
    const isDirectAdminLogin = email.toLowerCase() === adminEmail && providedPassword === adminPassword;

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

    // Seed Ketan Paswan Admin on-the-fly if logging in for the first time via Firebase
    if (!user) {
      if (email.toLowerCase() === adminEmail) {
        const randPassword = Math.random().toString(36).substring(2, 15);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randPassword, salt);

        user = await User.create({
          name: 'Super Admin',
          email: adminEmail,
          password: hashedPassword,
          role: 'Super Admin',
          isVerified: true,
          status: 'active'
        });
      } else {
        return res.status(404).json({ success: false, message: 'User account not found. Please register first.' });
      }
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

    if (providedEmail && providedPassword) {
      if (user.role !== 'Admin' && user.role !== 'Super Admin') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Direct credential login is restricted to administrator accounts.'
        });
      }
      const passwordMatch = await bcrypt.compare(providedPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
      }
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
    }

    if (decodedToken && !decodedToken.emailVerified) {
      return res.status(200).json({
        success: false,
        requiresVerification: true,
        message: 'Account is not verified. Please check your email inbox.',
        email: user.email
      });
    }

    // Sync verification status
    if (!user.isVerified) {
      await User.findByIdAndUpdate(user._id || user.id, { isVerified: true });
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

export const googleLogin = async (req, res) => {
  try {
    const { idToken, isRegister } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google authentication failed: missing token' });
    }

    const decodedToken = await verifyFirebaseToken(idToken);
    const email = decodedToken.email;
    const name = decodedToken.displayName || email.split('@')[0];

    // Seed Ketan Paswan if logging in for the first time via Google Firebase Auth
    if (email.toLowerCase() === 'ketanpaswan53@gmail.com') {
      let adminUser = await User.findOne({ email });
      if (!adminUser) {
        const randPassword = Math.random().toString(36).substring(2, 15);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randPassword, salt);
        
        await User.create({
          name: 'Super Admin',
          email,
          password: hashedPassword,
          role: 'Super Admin',
          isVerified: true,
          status: 'active'
        });
      }
    }

    let user = await User.findOne({ email });
    if (!user) {
      if (isRegister) {
        const randPassword = Math.random().toString(36).substring(2, 15);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randPassword, salt);

        user = await User.create({
          name,
          email,
          password: hashedPassword,
          isVerified: true, // Google accounts verified by default
          role: 'Creator',
          status: 'active'
        });
      } else {
        return res.status(404).json({ success: false, message: 'User account not found. Please register first.' });
      }
    } else {
      if (isRegister) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists. Please login instead.' });
      }
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
    }

    await SessionLog.create({
      userId: user._id || user.id,
      email: user.email,
      ipAddress: req.ip || '127.0.0.1',
      device: /mobile/i.test(req.headers['user-agent']) ? 'Mobile' : 'Desktop',
      browser: 'Google Integration (Firebase)',
      action: 'Google Login'
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      success: true,
      message: 'Google login successful',
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
    console.error('Google Login Error:', error);
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id || user.id, { otp, otpExpires });
    sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'Reset OTP sent to email',
      tempUserId: user._id || user.id,
      simulatedOTP: otp
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword } = req.body;

    if (!userId || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp !== otp || new Date(user.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      otp: null,
      otpExpires: null
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await User.findByIdAndUpdate(user._id || user.id, { otp, otpExpires });
    sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'A new 6-digit OTP code has been sent successfully.',
      simulatedOTP: otp
    });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
