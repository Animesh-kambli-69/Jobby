import { createClient } from 'redis';

let client = null;

export const connectRedis = async () => {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    client = createClient({ url, disableOfflineQueue: true });
    client.on('error', (err) => console.error('Redis error:', err.message));
    client.on('ready', () => console.log('✅ Redis connected'));
    await client.connect();
    return client;
  } catch {
    console.warn('⚠️ Redis unavailable, continuing without cache');
    client = null;
    return null;
  }
};

export const getRedis = () => (client?.isReady ? client : null);