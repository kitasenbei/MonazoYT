const express = require('express');
const crypto = require('crypto');
const { Diff } = require('diff');
const { marked } = require('marked');

const router = express.Router();

// Base64 Encode/Decode
router.post('/base64/encode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const encoded = Buffer.from(text).toString('base64');
    res.json({ result: encoded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/base64/decode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const decoded = Buffer.from(text, 'base64').toString('utf-8');
    res.json({ result: decoded });
  } catch (error) {
    res.status(500).json({ error: 'Invalid Base64 string' });
  }
});

// URL Encode/Decode
router.post('/url/encode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const encoded = encodeURIComponent(text);
    res.json({ result: encoded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/url/decode', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const decoded = decodeURIComponent(text);
    res.json({ result: decoded });
  } catch (error) {
    res.status(500).json({ error: 'Invalid URL encoded string' });
  }
});

// Hash Generator
router.post('/hash', (req, res) => {
  try {
    const { text, algorithm = 'sha256' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const validAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
    if (!validAlgorithms.includes(algorithm.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid algorithm' });
    }

    const hash = crypto.createHash(algorithm).update(text).digest('hex');
    res.json({ result: hash, algorithm });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// JWT Decoder
router.post('/jwt/decode', (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Invalid JWT format' });
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    res.json({ header, payload });
  } catch (error) {
    res.status(500).json({ error: 'Invalid JWT token' });
  }
});

// Text Diff
router.post('/diff', (req, res) => {
  try {
    const { text1, text2 } = req.body;
    if (!text1 || !text2) {
      return res.status(400).json({ error: 'Both texts are required' });
    }

    const Diff = require('diff');
    const diff = Diff.diffLines(text1, text2);
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Case Converter
router.post('/case', (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });
    if (!type) return res.status(400).json({ error: 'Type is required' });

    let result;
    switch (type) {
      case 'uppercase':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'titlecase':
        result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        break;
      case 'camelcase':
        result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
          index === 0 ? letter.toLowerCase() : letter.toUpperCase()
        ).replace(/\s+/g, '');
        break;
      case 'pascalcase':
        result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) =>
          letter.toUpperCase()
        ).replace(/\s+/g, '');
        break;
      case 'snakecase':
        result = text.replace(/\s+/g, '_').toLowerCase();
        break;
      case 'kebabcase':
        result = text.replace(/\s+/g, '-').toLowerCase();
        break;
      default:
        return res.status(400).json({ error: 'Invalid case type' });
    }

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lorem Ipsum Generator
router.post('/lorem', (req, res) => {
  try {
    const { paragraphs = 3, wordsPerParagraph = 50 } = req.body;

    const lorem = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
      'Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
      'Neque porro quisquam est qui dolorem ipsum quia dolor sit amet consectetur adipisci velit.',
      'Ut aliquam purus sit amet luctus venenatis lectus magna fringilla urna.'
    ];

    const result = Array.from({ length: paragraphs }, () => {
      const sentences = Math.ceil(wordsPerParagraph / 10);
      return Array.from({ length: sentences }, (_, i) => lorem[i % lorem.length]).join(' ');
    }).join('\n\n');

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Word Counter
router.post('/count', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const lines = text.split('\n').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    res.json({ words, characters, charactersNoSpaces, lines, paragraphs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Markdown Preview
router.post('/markdown', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const html = marked(text);
    res.json({ html });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// String Utilities
router.post('/string/reverse', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = text.split('').reverse().join('');
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/string/sort', (req, res) => {
  try {
    const { text, delimiter = '\n' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const lines = text.split(delimiter);
    const sorted = lines.sort();
    const result = sorted.join(delimiter);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/string/unique', (req, res) => {
  try {
    const { text, delimiter = '\n' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const lines = text.split(delimiter);
    const unique = [...new Set(lines)];
    const result = unique.join(delimiter);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
