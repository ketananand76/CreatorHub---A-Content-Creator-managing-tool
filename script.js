const fs = require('fs');
let code = fs.readFileSync('backend/controllers/authController.js', 'utf8');

// 1. Remove nodemailer import
code = code.replace(/import nodemailer from 'nodemailer';\n/, '');

// 2. Remove initTransporter, sendLinkEmail, sendRealEmail, getBrandHeader, getBrandFooter
const startIdx = code.indexOf('// Email Transporter Optimization');
const endIdx = code.indexOf('export const register = async (req, res) => {');
if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
}

// 3. Remove export const register, export const verifyEmail
const regStart = code.indexOf('export const register = async (req, res) => {');
const logStart = code.indexOf('export const login = async (req, res) => {');
if (regStart !== -1 && logStart !== -1) {
  code = code.substring(0, regStart) + code.substring(logStart);
}

// 4. Rename export const login to adminLogin
code = code.replace('export const login = async (req, res) => {', 'export const adminLogin = async (req, res) => {');

// 5. Remove forgotPassword, resetPassword, verifyOTP
const forgotStart = code.indexOf('export const forgotPassword = async (req, res) => {');
const profileStart = code.indexOf('export const getProfile = async (req, res) => {');
if (forgotStart !== -1 && profileStart !== -1) {
  code = code.substring(0, forgotStart) + code.substring(profileStart);
}

// 6. Insert firebaseSync before socialLogin
const socialLoginStart = code.indexOf('export const socialLogin = async (req, res) => {');
const firebaseSyncCode = `
export const firebaseSync = async (req, res) => {
  try {
    const { idToken, name, role } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Firebase ID Token is required.' });

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      return res.status(401).json({ success: false, message: 'Invalid or expired Firebase token.' });
    }

    if (!decodedToken.email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify your email first.' });
    }

    const email = decodedToken.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      // Create user if they don't exist
      user = await User.create({
        name: name || decodedToken.name || email.split('@')[0],
        email,
        role: role || 'Creator',
        isVerified: true
      });
    } else if (!user.isVerified) {
      // Mark as verified if they weren't
      user.isVerified = true;
      await user.save();
    }

    // Generate our JWT
    const { accessToken, refreshToken } = generateTokens(user._id || user.id);
    user.refreshToken = refreshToken;
    await user.save();

    await SessionLog.create({
      userId: user._id || user.id,
      email: user.email,
      ipAddress: req.ip,
      device: req.headers['user-agent'] || 'Unknown',
      location: 'Unknown',
      status: 'success'
    });

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
    console.error('Firebase Sync Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

`;

code = code.substring(0, socialLoginStart) + firebaseSyncCode + code.substring(socialLoginStart);

fs.writeFileSync('backend/controllers/authController.js', code);
console.log('authController.js rewrited successfully!');
