const express = require('express');
const yaml = require('js-yaml');
const { format: formatSQL } = require('sql-formatter');
const csso = require('csso');
const { minify: minifyJS } = require('terser');

const router = express.Router();

// JSON Formatter/Validator
router.post('/json/format', (req, res) => {
  try {
    const { text, indent = 2 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const parsed = JSON.parse(text);
    const formatted = JSON.stringify(parsed, null, indent);
    res.json({ result: formatted, valid: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON', details: error.message, valid: false });
  }
});

router.post('/json/minify', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const parsed = JSON.parse(text);
    const minified = JSON.stringify(parsed);
    res.json({ result: minified });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON', details: error.message });
  }
});

// JSON to YAML
router.post('/json-to-yaml', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const parsed = JSON.parse(text);
    const yamlStr = yaml.dump(parsed);
    res.json({ result: yamlStr });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JSON', details: error.message });
  }
});

// YAML to JSON
router.post('/yaml-to-json', (req, res) => {
  try {
    const { text, indent = 2 } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const parsed = yaml.load(text);
    const jsonStr = JSON.stringify(parsed, null, indent);
    res.json({ result: jsonStr });
  } catch (error) {
    res.status(400).json({ error: 'Invalid YAML', details: error.message });
  }
});

// SQL Formatter
router.post('/sql/format', (req, res) => {
  try {
    const { text, language = 'sql' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const formatted = formatSQL(text, { language });
    res.json({ result: formatted });
  } catch (error) {
    res.status(400).json({ error: 'Invalid SQL', details: error.message });
  }
});

// HTML Encoder/Decoder
router.post('/html/encode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const encoded = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    res.json({ result: encoded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/html/decode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const decoded = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    res.json({ result: decoded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSS Minifier
router.post('/css/minify', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = csso.minify(text);
    res.json({ result: result.css });
  } catch (error) {
    res.status(400).json({ error: 'Invalid CSS', details: error.message });
  }
});

// JS Minifier
router.post('/js/minify', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = await minifyJS(text);
    if (result.error) {
      return res.status(400).json({ error: 'Invalid JavaScript', details: result.error });
    }

    res.json({ result: result.code });
  } catch (error) {
    res.status(400).json({ error: 'Invalid JavaScript', details: error.message });
  }
});

module.exports = router;
