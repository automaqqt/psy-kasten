// Rate limiter with Redis support (production) and in-memory fallback (development)
// Uses Upstash Redis for distributed rate limiting

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client if credentials are available
let redis = null;
let upstashRatelimit = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create default rate limiter (can be overridden per endpoint)
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'psykasten:ratelimit',
  });

} else {
  console.warn('⚠️  Using in-memory rate limiting. For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
}

/**
 * Creates a rate limiter with specified options
 * Falls back to in-memory if Redis is not configured
 */
const rateLimit = (options = {}) => {
  const {
    interval = 60 * 1000, // 1 minute default
    uniqueTokenPerInterval = 500, // Max unique IPs per interval (in-memory only)
    maxRequests = 10, // Max requests per interval per IP
  } = options;

  // If Redis is available, use Upstash rate limiter
  if (upstashRatelimit && redis) {
    // Create custom rate limiter with specified options
    const customRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${interval}ms`),
      analytics: true,
      prefix: 'psykasten:ratelimit',
    });

    return {
      check: async (req, limit = maxRequests, token = null) => {
        const identifier = token || getIdentifier(req);

        try {
          const { success, limit: rateLimitLimit, remaining, reset } = await customRatelimit.limit(identifier);

          return {
            success,
            limit: rateLimitLimit,
            remaining,
            reset: new Date(reset),
          };
        } catch (error) {
          console.error('Redis rate limit check failed:', error);
          // Fail closed: deny request if rate limiter is unavailable
          return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            reset: new Date(Date.now() + interval),
          };
        }
      },
    };
  }

  // Fallback: In-memory rate limiter for development
  const tokenCache = new Map();

  // Cleanup old entries periodically
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
      if (now - value.resetTime > interval) {
        tokenCache.delete(key);
      }
    }
  }, interval);

  // Prevent memory leaks in long-running processes
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return {
    check: (req, limit = maxRequests, token = null) => {
      // Use provided token or fallback to IP address
      const identifier = token || getIdentifier(req);

      if (!tokenCache.has(identifier)) {
        tokenCache.set(identifier, {
          count: 0,
          resetTime: Date.now(),
        });
      }

      const tokenData = tokenCache.get(identifier);
      const now = Date.now();

      // Reset if interval has passed
      if (now - tokenData.resetTime > interval) {
        tokenData.count = 0;
        tokenData.resetTime = now;
      }

      // Check if limit exceeded
      if (tokenData.count >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          reset: new Date(tokenData.resetTime + interval),
        };
      }

      // Increment counter
      tokenData.count += 1;

      // Enforce max unique tokens
      if (tokenCache.size > uniqueTokenPerInterval) {
        // Remove oldest entries
        const entries = Array.from(tokenCache.entries());
        entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
        tokenCache.delete(entries[0][0]);
      }

      return {
        success: true,
        limit,
        remaining: limit - tokenData.count,
        reset: new Date(tokenData.resetTime + interval),
      };
    },
  };
};

// Helper to get client identifier
function getIdentifier(req) {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Create aggressive rate limiter for authentication endpoints
 * 5 attempts per 15 minutes
 */
export const createAuthRateLimiter = () => {
  return rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Very strict for auth
  });
};

/**
 * Create standard rate limiter for API endpoints
 * 20 requests per minute
 */
export const createApiRateLimiter = () => {
  return rateLimit({
    interval: 60 * 1000, // 1 minute
    maxRequests: 20,
  });
};

export default rateLimit;
