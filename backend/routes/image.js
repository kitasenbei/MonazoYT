const express = require('express');
const QRCode = require('qrcode');

const router = express.Router();

// QR Code Generator (same as URL but in image category for convenience)
router.post('/qrcode', async (req, res) => {
  try {
    const { text, size = 300, format = 'png' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const qrDataURL = await QRCode.toDataURL(text, {
      width: size,
      type: format === 'svg' ? 'svg' : 'image/png'
    });

    res.json({ qrcode: qrDataURL, format });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code', details: error.message });
  }
});

// Placeholder for ImageMagick-based tools
// These will require ImageMagick to be installed on the server
router.post('/info', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    message: 'Requires ImageMagick installation. Coming soon!'
  });
});

router.post('/convert', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    message: 'Requires ImageMagick installation. Coming soon!'
  });
});

router.post('/resize', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    message: 'Requires ImageMagick installation. Coming soon!'
  });
});

router.post('/compress', (req, res) => {
  res.status(501).json({
    error: 'Not implemented yet',
    message: 'Requires ImageMagick installation. Coming soon!'
  });
});

module.exports = router;
