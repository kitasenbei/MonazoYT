const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// UUID Generator
router.post('/uuid', (req, res) => {
  try {
    const { count = 1 } = req.body;
    const uuids = Array.from({ length: Math.min(count, 100) }, () => crypto.randomUUID());

    res.json({ uuids, count: uuids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Random String Generator
router.post('/random-string', (req, res) => {
  try {
    const { length = 16, includeUppercase = true, includeLowercase = true, includeNumbers = true, includeSymbols = false } = req.body;

    if (length < 1 || length > 1000) {
      return res.status(400).json({ error: 'Length must be between 1 and 1000' });
    }

    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset.length === 0) {
      return res.status(400).json({ error: 'At least one character type must be selected' });
    }

    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Timestamp Converter
router.post('/timestamp/to-date', (req, res) => {
  try {
    const { timestamp } = req.body;
    if (timestamp === undefined) return res.status(400).json({ error: 'Timestamp is required' });

    const date = new Date(parseInt(timestamp));

    res.json({
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: date.toLocaleString(),
      timestamp: date.getTime()
    });
  } catch (error) {
    res.status(400).json({ error: 'Invalid timestamp', details: error.message });
  }
});

router.post('/timestamp/from-date', (req, res) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const timestamp = new Date(date).getTime();

    if (isNaN(timestamp)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    res.json({ timestamp });
  } catch (error) {
    res.status(400).json({ error: 'Invalid date', details: error.message });
  }
});

router.get('/timestamp/now', (req, res) => {
  try {
    const now = new Date();

    res.json({
      timestamp: now.getTime(),
      iso: now.toISOString(),
      utc: now.toUTCString(),
      local: now.toLocaleString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Number Base Converter
router.post('/base-convert', (req, res) => {
  try {
    const { number, fromBase, toBase } = req.body;

    if (!number) return res.status(400).json({ error: 'Number is required' });
    if (!fromBase || !toBase) return res.status(400).json({ error: 'From and to bases are required' });

    const validBases = [2, 8, 10, 16];
    if (!validBases.includes(parseInt(fromBase)) || !validBases.includes(parseInt(toBase))) {
      return res.status(400).json({ error: 'Invalid base. Supported: 2, 8, 10, 16' });
    }

    const decimal = parseInt(number, fromBase);
    if (isNaN(decimal)) {
      return res.status(400).json({ error: 'Invalid number for the specified base' });
    }

    const result = decimal.toString(toBase).toUpperCase();

    res.json({ result, decimal });
  } catch (error) {
    res.status(400).json({ error: 'Conversion failed', details: error.message });
  }
});

// Color Converter
router.post('/color-convert', (req, res) => {
  try {
    const { color, fromFormat, toFormat } = req.body;

    if (!color) return res.status(400).json({ error: 'Color is required' });

    let r, g, b;

    // Parse input color
    if (fromFormat === 'hex') {
      const hex = color.replace('#', '');
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (fromFormat === 'rgb') {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) return res.status(400).json({ error: 'Invalid RGB format' });
      [, r, g, b] = match.map(Number);
    }

    if (r === undefined || g === undefined || b === undefined) {
      return res.status(400).json({ error: 'Failed to parse color' });
    }

    // Convert to requested format
    let result;
    if (toFormat === 'hex') {
      result = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    } else if (toFormat === 'rgb') {
      result = `rgb(${r}, ${g}, ${b})`;
    } else if (toFormat === 'hsl') {
      r /= 255;
      g /= 255;
      b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      result = `hsl(${h}, ${s}%, ${l}%)`;
    }

    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Conversion failed', details: error.message });
  }
});

module.exports = router;
