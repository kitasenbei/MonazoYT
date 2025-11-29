const express = require('express');
const QRCode = require('qrcode');
const { URL } = require('url');

const router = express.Router();

// URL Parser
router.post('/parse', (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const parsed = new URL(url);

    const result = {
      href: parsed.href,
      origin: parsed.origin,
      protocol: parsed.protocol,
      username: parsed.username,
      password: parsed.password,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      searchParams: Object.fromEntries(parsed.searchParams),
      hash: parsed.hash
    };

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid URL', details: error.message });
  }
});

// QR Code Generator
router.post('/qrcode', async (req, res) => {
  try {
    const { text, size = 300 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const qrDataURL = await QRCode.toDataURL(text, { width: size });
    res.json({ qrcode: qrDataURL });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
  }
});

// URL Slug Generator
router.post('/slug', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const slug = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
      .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
      .replace(/--+/g, '-')     // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    res.json({ result: slug });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query String Parser
router.post('/query-parse', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query string is required' });

    // Remove leading ? if present
    const cleanQuery = query.startsWith('?') ? query.slice(1) : query;
    const params = new URLSearchParams(cleanQuery);
    const result = Object.fromEntries(params);

    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: 'Invalid query string', details: error.message });
  }
});

module.exports = router;
