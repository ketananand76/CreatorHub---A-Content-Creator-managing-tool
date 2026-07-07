import mongoose from 'mongoose';
import { getJsonModel } from '../utils/jsonDb.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Set DNS servers to Google DNS to bypass local ISP DNS blocks/timeouts on Atlas SRV queries
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Unable to set Google DNS servers, falling back to system default:', e.message);
}

const useMongo = !!process.env.MONGODB_URI;

if (useMongo) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI environment variable found. Falling back to local file JSON database.');
}

// Mongoose Schemas (for when MongoDB is connected)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  countryCode: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, enum: ['Creator', 'Team Member', 'Admin', 'Super Admin'], default: 'Creator' },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  verificationToken: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  isTwoFAEnabled: { type: Boolean, default: false },
  twoFASecret: { type: String, default: null },
  isPremium: { type: Boolean, default: false },
  premiumExpires: { type: Date, default: null },
  status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
  bio: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  referralCode: { type: String, default: null, unique: true, sparse: true },
  referredBy: { type: String, default: null },
  referralCount: { type: Number, default: 0 },
  niche: { type: String, default: '' },
  youtubeSubscribers: { type: Number, default: 0 },
  instagramFollowers: { type: Number, default: 0 },
  facebookFollowers: { type: Number, default: 0 },
  tiktokFollowers: { type: Number, default: 0 },
  averageEngagement: { type: String, default: '' },
  youtubeLink: { type: String, default: '' },
  instagramLink: { type: String, default: '' },
  facebookLink: { type: String, default: '' },
  tiktokLink: { type: String, default: '' },
  socialMetrics: {
    youtube: {
      channelId: { type: String, default: '' },
      subscribers: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      videos: { type: Number, default: 0 },
      lastSynced: { type: Date, default: null }
    },
    instagram: {
      username: { type: String, default: '' },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      lastSynced: { type: Date, default: null }
    },
    facebook: {
      pageId: { type: String, default: '' },
      followers: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      lastSynced: { type: Date, default: null }
    }
  }
}, { timestamps: true });

const CalendarEventSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  start: { type: String, required: true }, // Store as string for easy date manipulation/drag & drop
  end: { type: String },
  platform: { type: String, default: 'YouTube' },
  reminderMinutes: { type: Number, default: 30 },
  isReminderSent: { type: Boolean, default: false }
}, { timestamps: true });

const BrandDealSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  sponsorName: { type: String, required: true },
  dealTitle: { type: String, required: true },
  dealValue: { type: Number, required: true },
  stage: { type: String, enum: ['Lead', 'Pitching', 'Negotiating', 'Contract Signed', 'Payment Pending', 'Completed'], default: 'Lead' },
  notes: { type: String },
  contractUrl: { type: String, default: '' }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  upiId: { type: String, default: '9771735011@mbk' },
  utr: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  screenshotUrl: { type: String, default: '' }
}, { timestamps: true });

const TeamTaskSchema = new mongoose.Schema({
  creatorId: { type: String, required: true }, // Owner Creator
  assignedTo: { type: String, required: true }, // User ID of Team Member
  assignedToName: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
  deadline: { type: String, required: true }
}, { timestamps: true });

const MessageSchema = new mongoose.Schema({
  creatorId: { type: String, required: true }, // Context for team channel chat
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true }
}, { timestamps: true });

const SessionLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  ipAddress: { type: String, default: '127.0.0.1' },
  device: { type: String, default: 'Desktop' },
  browser: { type: String, default: 'Chrome' },
  action: { type: String, default: 'Login' }
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  reply: { type: String, default: '' }
}, { timestamps: true });

const IncomeExpenseSchema = new mongoose.Schema({
  creatorId: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true }, // e.g. AdSense, Sponsor, Gear, Software, Office
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String }
}, { timestamps: true });

const SystemSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: '' }
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // 'all' for broadcasts, or user ID
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['broadcast', 'subscription', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  isReadBy: [{ type: String }] // Array of userIds who read it (for broadcasts)
}, { timestamps: true });

const SocialAccountSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  platform: { type: String, enum: ['instagram', 'facebook', 'youtube'], required: true },
  connected: { type: Boolean, default: true },
  username: { type: String },
  displayName: { type: String },
  profilePicture: { type: String },
  followersCount: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  totalReach: { type: Number, default: 0 },
  items: [{
    itemId: { type: String }, // videoId or postId
    title: { type: String },  // title or caption/message
    type: { type: String },   // 'post', 'reel', 'video'
    views: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    url: { type: String },
    publishedAt: { type: Date }
  }]
}, { timestamps: true });

const MongoUser = useMongo ? mongoose.model('User', UserSchema) : null;
const MongoCalendarEvent = useMongo ? mongoose.model('CalendarEvent', CalendarEventSchema) : null;
const MongoBrandDeal = useMongo ? mongoose.model('BrandDeal', BrandDealSchema) : null;
const MongoTransaction = useMongo ? mongoose.model('Transaction', TransactionSchema) : null;
const MongoTeamTask = useMongo ? mongoose.model('TeamTask', TeamTaskSchema) : null;
const MongoMessage = useMongo ? mongoose.model('Message', MessageSchema) : null;
const MongoSessionLog = useMongo ? mongoose.model('SessionLog', SessionLogSchema) : null;
const MongoTicket = useMongo ? mongoose.model('Ticket', TicketSchema) : null;
const MongoIncomeExpense = useMongo ? mongoose.model('IncomeExpense', IncomeExpenseSchema) : null;
const MongoSystemSettings = useMongo ? mongoose.model('SystemSettings', SystemSettingsSchema) : null;
const MongoNotification = useMongo ? mongoose.model('Notification', NotificationSchema) : null;
const MongoSocialAccount = useMongo ? mongoose.model('SocialAccount', SocialAccountSchema) : null;

// JSON Model Fallbacks
const JsonUser = getJsonModel('User');
const JsonCalendarEvent = getJsonModel('CalendarEvent');
const JsonBrandDeal = getJsonModel('BrandDeal');
const JsonTransaction = getJsonModel('Transaction');
const JsonTeamTask = getJsonModel('TeamTask');
const JsonMessage = getJsonModel('Message');
const JsonSessionLog = getJsonModel('SessionLog');
const JsonTicket = getJsonModel('Ticket');
const JsonIncomeExpense = getJsonModel('IncomeExpense');
const JsonSystemSettings = getJsonModel('SystemSettings');
const JsonNotification = getJsonModel('Notification');
const JsonSocialAccount = getJsonModel('SocialAccount');

// Wrapper creator
const createModelWrapper = (mongoModel, jsonModel) => {
  return {
    find: async (query) => {
      if (useMongo) return await mongoModel.find(query).lean();
      return await jsonModel.find(query);
    },
    findOne: async (query) => {
      if (useMongo) return await mongoModel.findOne(query).lean();
      return await jsonModel.findOne(query);
    },
    findById: async (id) => {
      if (useMongo) return await mongoModel.findById(id).lean();
      return await jsonModel.findById(id);
    },
    create: async (data) => {
      if (useMongo) {
        const item = await mongoModel.create(data);
        return item.toObject();
      }
      return await jsonModel.create(data);
    },
    findOneAndUpdate: async (query, update, options = {}) => {
      if (useMongo) {
        const result = await mongoModel.findOneAndUpdate(query, update, { new: true, ...options });
        return result ? result.toObject() : null;
      }
      return await jsonModel.findOneAndUpdate(query, update, options);
    },
    findByIdAndUpdate: async (id, update, options) => {
      if (useMongo) return await mongoModel.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
      return await jsonModel.findByIdAndUpdate(id, update, options);
    },
    updateOne: async (query, update) => {
      if (useMongo) return await mongoModel.updateOne(query, update);
      return await jsonModel.updateOne(query, update);
    },
    deleteOne: async (query) => {
      if (useMongo) return await mongoModel.deleteOne(query);
      return await jsonModel.deleteOne(query);
    },
    deleteMany: async (query) => {
      if (useMongo) return await mongoModel.deleteMany(query);
      return await jsonModel.deleteMany(query);
    }
  };
};

export const User = createModelWrapper(MongoUser, JsonUser);
export const CalendarEvent = createModelWrapper(MongoCalendarEvent, JsonCalendarEvent);
export const BrandDeal = createModelWrapper(MongoBrandDeal, JsonBrandDeal);
export const Transaction = createModelWrapper(MongoTransaction, JsonTransaction);
export const TeamTask = createModelWrapper(MongoTeamTask, JsonTeamTask);
export const Message = createModelWrapper(MongoMessage, JsonMessage);
export const SessionLog = createModelWrapper(MongoSessionLog, JsonSessionLog);
export const Ticket = createModelWrapper(MongoTicket, JsonTicket);
export const IncomeExpense = createModelWrapper(MongoIncomeExpense, JsonIncomeExpense);
export const SystemSettings = createModelWrapper(MongoSystemSettings, JsonSystemSettings);
export const Notification = createModelWrapper(MongoNotification, JsonNotification);
export const SocialAccount = createModelWrapper(MongoSocialAccount, JsonSocialAccount);
export { useMongo };
