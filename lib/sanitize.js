/**
 * Input sanitization utilities
 * Prevents XSS attacks and ensures clean data storage
 */

import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Sanitize HTML content - removes all HTML tags and scripts
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags and scripts
  return sanitizeHtml(input, {
    allowedTags: [], // No tags allowed
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

/**
 * Sanitize rich text content - allows basic formatting tags
 * Use for fields where users might need basic formatting (like descriptions)
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeRichText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Allow only safe HTML tags for basic formatting
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    allowedSchemes: [],
  }).trim();
}

/**
 * Sanitize email address
 * @param {string} email - Email to sanitize and validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  if (!validator.isEmail(trimmed)) {
    return null;
  }

  // Normalize email
  return validator.normalizeEmail(trimmed, {
    gmail_remove_dots: false, // Keep dots in Gmail addresses
    gmail_remove_subaddress: false, // Keep + addressing
  });
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  if (!validator.isURL(trimmed, { protocols: ['http', 'https'], require_protocol: true })) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize identifier (alphanumeric only, with optional dashes/underscores)
 * Useful for participant IDs, study codes, etc.
 * @param {string} identifier - The identifier to sanitize
 * @returns {string} - Sanitized identifier
 */
export function sanitizeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return '';
  }

  // Remove everything except letters, numbers, dashes, underscores
  return identifier.replace(/[^a-zA-Z0-9\-_]/g, '').trim();
}

/**
 * Sanitize number (ensures it's a valid number)
 * @param {any} value - Value to sanitize as number
 * @param {object} options - Options for validation
 * @returns {number|null} - Sanitized number or null if invalid
 */
export function sanitizeNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, integer = false } = options;

  let num;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseInt ? parseFloat(value) : NaN;
  } else {
    return null;
  }

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (integer && !Number.isInteger(num)) {
    num = Math.floor(num);
  }

  if (num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitize filename - removes path traversal attempts
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Safe filename
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') {
    return '';
  }

  // Remove path separators and parent directory references
  return filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename chars
    .trim();
}

/**
 * Sanitize object - recursively sanitize all string values
 * @param {object} obj - Object to sanitize
 * @param {function} sanitizer - Sanitizer function to apply (default: sanitizeText)
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj, sanitizer = sanitizeText) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizer));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Comprehensive sanitization for API input
 * Applies appropriate sanitization based on field name
 * @param {object} data - Data object to sanitize
 * @returns {object} - Sanitized data
 */
export function sanitizeApiInput(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip null/undefined
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }

    // Email fields
    if (key.toLowerCase().includes('email')) {
      sanitized[key] = sanitizeEmail(value);
      continue;
    }

    // URL fields
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      sanitized[key] = sanitizeUrl(value);
      continue;
    }

    // Description fields (allow basic formatting)
    if (key.toLowerCase().includes('description') || key.toLowerCase().includes('notes')) {
      sanitized[key] = sanitizeRichText(value);
      continue;
    }

    // Identifier fields
    if (key.toLowerCase().includes('identifier') || key.toLowerCase().includes('code')) {
      sanitized[key] = sanitizeIdentifier(value);
      continue;
    }

    // Filename fields
    if (key.toLowerCase().includes('filename')) {
      sanitized[key] = sanitizeFilename(value);
      continue;
    }

    // Numbers
    if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
      continue;
    }

    // Nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeApiInput(value);
      continue;
    }

    // Arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' ? sanitizeApiInput(item) : sanitizeText(String(item))
      );
      continue;
    }

    // Default: plain text sanitization
    sanitized[key] = sanitizeText(String(value));
  }

  return sanitized;
}

export default {
  sanitizeText,
  sanitizeRichText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeIdentifier,
  sanitizeNumber,
  sanitizeFilename,
  sanitizeObject,
  sanitizeApiInput,
};
