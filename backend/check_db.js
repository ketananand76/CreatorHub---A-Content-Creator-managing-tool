import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/creatorhub';
mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({}); // getting the first user since there's only one
  console.log("youtubeLink:", user.youtubeLink, "type:", typeof user.youtubeLink, "length:", user.youtubeLink?.length);
  console.log("instagramLink:", user.instagramLink, "type:", typeof user.instagramLink, "length:", user.instagramLink?.length);
  console.log("facebookLink:", user.facebookLink, "type:", typeof user.facebookLink, "length:", user.facebookLink?.length);
  console.log("socialMetrics:", JSON.stringify(user.socialMetrics));
  process.exit(0);
});
