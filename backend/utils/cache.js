// backend/utils/cache.js
// Small reusable helpers for caching with Redis.
import crypto from 'crypto';
import { getRedis } from '../config/redis.js';

// Every key starts with "jobby:" so Jobby's keys are easy to find
// and never clash with another app using the same Redis.
const PREFIX = 'jobby:';

// Turns any long text (like a whole resume) into a short, fixed-length
// fingerprint. Same text -> same fingerprint, so it works as a cache key.
export const hashKey = (text) =>
  crypto.createHash('sha256').update(String(text)).digest('hex');

// Read a value. Returns null if missing, expired, or Redis is unavailable.
export const cacheGet = async (key) => {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(PREFIX + key);
    return raw ? JSON.parse(raw) : null; // Redis stores text, so turn JSON back into an object
  } catch (err) {
    console.error('Cache read failed:', err.message);
    return null; // treat any problem as a cache miss
  }
};

// Save a value that Redis deletes automatically after ttlSeconds.
export const cacheSet = async (key, value, ttlSeconds) => {
  const redis = getRedis();
  if (!redis || value === null || value === undefined) return;
  try {
    await redis.setEx(PREFIX + key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.error('Cache write failed:', err.message);
  }
};

// Delete one or more keys (used when the real data changes).
export const cacheDel = async (...keys) => {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(keys.map((k) => PREFIX + k));
  } catch (err) {
    console.error('Cache delete failed:', err.message);
  }
};

// The main tool: "give me this value; if you don't have it, run fetchFn,
// remember the result for ttlSeconds, and give me that."
// shouldCache lets you refuse to store bad results (e.g. an AI error fallback).
export const remember = async (key, ttlSeconds, fetchFn, { shouldCache = () => true } = {}) => {
  const cached = await cacheGet(key);
  if (cached !== null) {
    console.log(`⚡ cache HIT  ${key.slice(0, 40)}`);
    return cached;
  }

  console.log(`🐢 cache MISS ${key.slice(0, 40)}`);
  const fresh = await fetchFn();

  if (fresh !== null && fresh !== undefined && shouldCache(fresh)) {
    await cacheSet(key, fresh, ttlSeconds);
  }
  return fresh;
};