// backend/middleware/rateLimiter.js
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis.js';

let limiters = null; // built once, after Redis has connected (see server.js)

// Returns a Redis-backed store if Redis is ready, otherwise undefined,
// which tells express-rate-limit to fall back to its built-in memory store.
const makeStore = (name) => {
  const client = getRedis();
  if (!client) return undefined;
  return new RedisStore({
    sendCommand: (...args) => client.sendCommand(args), // how the store talks to Redis
    prefix: `jobby:rl:${name}:`                         // e.g. jobby:rl:auth:203.0.113.5
  });
};

export const initRateLimiters = () => {
  limiters = {
    // Login and sign-up: 10 FAILED attempts per 15 minutes per IP address.
    auth: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      skipSuccessfulRequests: true, // a correct password doesn't use up an attempt
      standardHeaders: 'draft-7',   // send RateLimit headers so clients know their limit
      legacyHeaders: false,
      passOnStoreError: true,       // if Redis breaks mid-request, let the request through
      store: makeStore('auth'),
      message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
    }),

    // AI endpoints: 100 calls per day per logged-in user.
    ai: rateLimit({
      windowMs: 24 * 60 * 60 * 1000,
      limit: 100,
      keyGenerator: (req) => String(req.userId), // count per user, not per IP
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      passOnStoreError: true,
      store: makeStore('ai'),
      message: { success: false, message: 'Daily AI limit reached. Please try again tomorrow.' }
    })
  };
  console.log(`🛡️  Rate limiters ready (${getRedis() ? 'Redis' : 'in-memory'} store)`);
};

// Routes import these two. They are tiny wrappers so routes can be defined
// before initRateLimiters() runs. Until then they simply let requests pass.
export const authLimiter = (req, res, next) => (limiters ? limiters.auth(req, res, next) : next());
export const aiLimiter = (req, res, next) => (limiters ? limiters.ai(req, res, next) : next());