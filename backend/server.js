import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import passport from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import earningsRoutes from './routes/earningsRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import { User } from './models/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5005;
const PORT = DEFAULT_PORT;

// Enable trust proxy (needed for rate limiters if behind a reverse proxy/localhost)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: \'10mb\' }));
app.use(express.urlencoded({ limit: \'10mb\', extended: true }));

// Session for OAuth
app.use(session({
  secret: process.env.JWT_SECRET || 'creatorhub-secret-key-fallback',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/social', socialRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.warn('Malformed JSON body received:', err.message);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload. Please send a valid JSON body.' });
  }

  console.error('Unhandled Server Error:', err.stack || err.message || err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const seedSuperAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'ketanpaswan53@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'Ketan@123';
    
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await User.create({
        name: 'Ketan Paswan',
        email: adminEmail,
        password: hashedPassword,
        role: 'Super Admin',
        isVerified: true,
        status: 'active'
      });
      console.log('====================================');
      console.log(`[SEEDING] Super Admin Ketan Paswan created successfully!`);
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      console.log('====================================');
    } else {
      if (existing.role !== 'Super Admin') {
        await User.findByIdAndUpdate(existing._id || existing.id, { role: 'Super Admin' });
        console.log(`[SEEDING] Locked role of ${adminEmail} to Super Admin.`);
      }
    }
  } catch (err) {
    console.error('Error seeding Super Admin:', err);
  }
};

// Start Server
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`CreatorHub Backend engine running on port ${port}`);
    seedSuperAdmin();
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
};

startServer(PORT);
