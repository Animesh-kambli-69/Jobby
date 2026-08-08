import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB, { resolveMongoUri } from '../config/db.js';

dotenv.config();

const initDatabase = async () => {
  try {
    console.log(`Initializing database using ${resolveMongoUri()}`);
    await connectDB();
    await mongoose.connection.close();
    console.log('Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();
