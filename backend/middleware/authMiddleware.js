import jwt from 'jsonwebtoken';
import { User } from '../models/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'creatorhub-super-secret-key-123';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found. Session expired.' });
      }

      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({ success: false, message: `Your account is ${user.status}. Contact support.` });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided.' });
  }
};

const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com';

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no valid session found.'
      });
    }

    const allowed = new Set(roles);
    if (!allowed.has(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this resource.`
      });
    }

    if (req.path.includes('/admin') && req.user.email !== adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the system administrator can use this area.'
      });
    }

    next();
  };
};
