const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, 'keys.json');

/**
 * Load valid keys from JSON file
 * @returns {string[]} Array of valid SHA256 keys
 */
function loadValidKeys() {
  try {
    const data = fs.readFileSync(KEYS_FILE, 'utf8');
    const { validKeys } = JSON.parse(data);
    return validKeys || [];
  } catch (error) {
    console.error('Error loading keys file:', error);
    return [];
  }
}

/**
 * Middleware to verify auth key
 */
function authMiddleware(req, res, next) {
  const authKey = req.headers['x-auth-key'];

  if (!authKey) {
    return res.status(401).json({ error: 'Authentication required', code: 'NO_KEY' });
  }

  const validKeys = loadValidKeys();

  if (!validKeys.includes(authKey)) {
    return res.status(403).json({ error: 'Invalid authentication key', code: 'INVALID_KEY' });
  }

  next();
}

/**
 * Endpoint to verify a key (doesn't need auth middleware obviously)
 */
function verifyKey(req, res) {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'Key is required' });
  }

  const validKeys = loadValidKeys();

  if (validKeys.includes(key)) {
    return res.json({ valid: true });
  }

  return res.status(403).json({ valid: false, error: 'Invalid key' });
}

module.exports = {
  authMiddleware,
  verifyKey,
  loadValidKeys
};
