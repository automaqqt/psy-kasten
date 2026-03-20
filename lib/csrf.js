/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests (POST, PUT, DELETE, PATCH)
 * Uses NextAuth's CSRF token mechanism
 */

import { getCsrfToken } from 'next-auth/react';

/**
 * Validates CSRF token from request
 * @param {object} req - Next.js request object
 * @returns {Promise<boolean>} - True if token is valid
 */
export async function validateCsrfToken(req) {
  // Only check CSRF for state-changing methods
  const stateMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!stateMethods.includes(req.method)) {
    return true;
  }

  // Get CSRF token from request (check multiple sources)
  const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  const tokenFromBody = req.body?.csrfToken;
  const submittedToken = tokenFromHeader || tokenFromBody;

  if (!submittedToken) {
    console.warn('CSRF token missing from request');
    return false;
  }

  // Get expected CSRF token from NextAuth
  // In API routes, we need to validate against the cookie
  const csrfCookie = req.cookies['next-auth.csrf-token'] || req.cookies['__Host-next-auth.csrf-token'];

  if (!csrfCookie) {
    console.warn('CSRF cookie not found');
    return false;
  }

  // NextAuth stores CSRF token as: "token|hash"
  const [expectedToken] = csrfCookie.split('|');

  // Compare tokens (constant-time comparison to prevent timing attacks)
  return timingSafeEqual(submittedToken, expectedToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * CSRF middleware wrapper for API routes
 * Usage: export default withCsrfProtection(handler);
 */
export function withCsrfProtection(handler) {
  return async (req, res) => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return handler(req, res);
    }

    // Validate CSRF token
    const isValid = await validateCsrfToken(req);
    if (!isValid) {
      console.warn(`CSRF validation failed for ${req.method} ${req.url}`);
      return res.status(403).json({
        message: 'CSRF token validation failed. Please refresh the page and try again.',
      });
    }

    // Token is valid, proceed with handler
    return handler(req, res);
  };
}

/**
 * Simpler CSRF check for routes that don't need the wrapper
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {boolean} - True if validation passed or not needed
 */
export async function checkCsrf(req, res) {
  const isValid = await validateCsrfToken(req);

  if (!isValid) {
    console.warn(`CSRF validation failed for ${req.method} ${req.url}`);
    res.status(403).json({
      message: 'CSRF token validation failed. Please refresh the page and try again.',
    });
    return false;
  }

  return true;
}

export default withCsrfProtection;
