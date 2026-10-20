import dns from 'node:dns';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}

const resolveMongoUri = () => process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobgraph';

const initializeDatabase = async () => {
  await Promise.all([User.init(), Job.init(), Application.init()]);
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(resolveMongoUri(), { serverSelectionTimeoutMS: 10000 });
    await initializeDatabase();
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { initializeDatabase, resolveMongoUri };
