const validator = require('validator');

// Whitelist of allowed video platforms
const ALLOWED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
  'vimeo.com',
  'www.vimeo.com',
  'dailymotion.com',
  'www.dailymotion.com',
  'twitch.tv',
  'www.twitch.tv'
];

/**
 * Validate and sanitize a video URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidVideoURL(url) {
  // Check if it's a valid URL
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_query_components: true
  })) {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Check if domain is in whitelist
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      return false;
    }

    // Additional YouTube-specific checks
    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      // Ensure it has a valid video ID or playlist ID
      const hasVideoId = urlObj.searchParams.has('v') ||
                         urlObj.pathname.includes('/watch') ||
                         urlObj.pathname.includes('/shorts') ||
                         hostname === 'youtu.be';

      const hasPlaylistId = urlObj.searchParams.has('list');

      if (!hasVideoId && !hasPlaylistId) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  if (!filename) return 'video.mp4';

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');

  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Remove leading/trailing whitespace and dots
  sanitized = sanitized.trim().replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    sanitized = sanitized.slice(0, 255 - ext.length) + ext;
  }

  // If sanitization resulted in empty string, use default
  return sanitized || 'video.mp4';
}

/**
 * Validate limit parameter
 * @param {number} limit - The limit value
 * @returns {number} - Validated and bounded limit
 */
function validateLimit(limit) {
  const numLimit = parseInt(limit, 10);

  if (isNaN(numLimit) || numLimit < 1) {
    return 50; // Default
  }

  // Max 100 videos
  return Math.min(numLimit, 100);
}

module.exports = {
  isValidVideoURL,
  sanitizeFilename,
  validateLimit,
  ALLOWED_DOMAINS
};
