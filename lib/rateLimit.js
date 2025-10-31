// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis-based solutions like upstash/ratelimit

const rateLimit = (options = {}) => {
  const {
    interval = 60 * 1000, // 1 minute default
    uniqueTokenPerInterval = 500, // Max unique IPs per interval
    maxRequests = 10, // Max requests per interval per IP
  } = options;

  const tokenCache = new Map();

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenCache.entries()) {
      if (now - value.resetTime > interval) {
        tokenCache.delete(key);
      }
    }
  }, interval);

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

export default rateLimit;
