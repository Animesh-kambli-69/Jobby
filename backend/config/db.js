import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const resolveMongoUri = () => {
  const envUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (envUri && envUri.trim()) {
    return envUri.trim();
  }

  const dbName = process.env.MONGODB_DB_NAME || 'jobgraph';
  return `mongodb://127.0.0.1:27017/${dbName}`;
};

const deduplicateApplications = async () => {
  const duplicates = await Application.aggregate([
    { $sort: { appliedAt: 1, _id: 1 } },
    {
      $group: {
        _id: {
          jobId: '$jobId',
          candidateEmail: { $toLower: '$candidateEmail' }
        },
        ids: { $push: '$_id' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (!duplicates.length) {
    return;
  }

  let deletedCount = 0;
  for (const duplicateGroup of duplicates) {
    const ids = duplicateGroup.ids || [];
    const idsToDelete = ids.slice(1); // keep oldest application
    if (idsToDelete.length > 0) {
      const result = await Application.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += result.deletedCount || 0;
    }
  }

  console.log(`⚠️ Removed ${deletedCount} duplicate application records before index sync`);
};

const initializeDatabase = async () => {
  await deduplicateApplications();

  // init() builds indexes and creates collections when needed.
  await Promise.all([
    User.init(),
    Job.init(),
    Application.init()
  ]);
};

const connectDB = async () => {
  try {
    const mongoUri = resolveMongoUri();
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10
    });

    await conn.connection.db.admin().ping();
    await initializeDatabase();
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log('✅ MongoDB collections and indexes are ready');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { initializeDatabase, resolveMongoUri };
