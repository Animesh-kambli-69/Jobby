// backend/config/redis.js
import { createClient } from 'redis';

let client = null;          // the single shared connection
let hasConnectedOnce = false;

export const connectRedis = async () => {
  // Read the URL *inside* the function, not at the top of the file.
  // Why: with ES modules, files are loaded before dotenv runs,
  // so process.env may still be empty at the top of a file.
  const url = process.env.REDIS_URL;

  if (!url) {
    console.warn('⚠️  REDIS_URL not set. Running without Redis (no cache, in-memory rate limits).');
    return null;
  }

  client = createClient({
    url,
    // If Redis goes down, fail commands immediately instead of queueing them.
    // Why: a queued command would make the user's request hang forever.
    disableOfflineQueue: true,
    socket: {
      // Decide how long to wait before reconnecting after a drop.
      reconnectStrategy: (retries) => {
        // At startup, give up after 3 tries so the server still starts without Redis.
        if (!hasConnectedOnce && retries >= 3) {
          return new Error('Redis not reachable at startup');
        }
        // After we've been connected once, keep retrying: 0.2 s, 0.4 s ... max 5 s.
        return Math.min(retries * 200, 5000);
      }
    }
  });

  // Why this listener matters: without an 'error' listener, Node
  // crashes the whole server the first time Redis has a hiccup.
  client.on('error', (err) => console.error('❌ Redis error:', err.message));
  client.on('ready', () => {
    hasConnectedOnce = true;
    console.log('✅ Redis connected');
  });
  client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

  try {
    await client.connect();
  } catch (err) {
    console.error('❌ Could not connect to Redis. Continuing without it:', err.message);
    client = null;
  }

  return client;
};

// Other files call this. It returns the client only when it is
// connected and ready, otherwise null, so callers can simply skip Redis.
export const getRedis = () => (client && client.isReady ? client : null);