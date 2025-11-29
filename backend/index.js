const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const contentDisposition = require('content-disposition');
const { sanitizeFilename } = require('./security');
const { authMiddleware, verifyKey } = require('./auth');

// Import service routes
const youtubeRouter = require('./routes/youtube');
const textRouter = require('./routes/text');
const codeRouter = require('./routes/code');
const urlRouter = require('./routes/url');
const otherRouter = require('./routes/other');
const imageRouter = require('./routes/image');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Create downloads directory if it doesn't exist
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Mount service routers
app.use('/api/youtube', authMiddleware, youtubeRouter);
app.use('/api/text', authMiddleware, textRouter);
app.use('/api/code', authMiddleware, codeRouter);
app.use('/api/url', authMiddleware, urlRouter);
app.use('/api/other', authMiddleware, otherRouter);
app.use('/api/image', authMiddleware, imageRouter);

// Force download endpoint (with Content-Disposition header)
app.get('/downloads/:filename', (req, res) => {
  // Sanitize filename
  let filename = req.params.filename;
  filename = sanitizeFilename(decodeURIComponent(filename));

  // Build and normalize path
  const filepath = path.join(DOWNLOADS_DIR, filename);
  const normalizedPath = path.normalize(filepath);

  // Prevent path traversal - ensure file is within DOWNLOADS_DIR
  if (!normalizedPath.startsWith(path.normalize(DOWNLOADS_DIR))) {
    console.error('✗ Security: Path traversal attempt:', filename);
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists
  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check if it's actually a file (not a directory)
  const stats = fs.statSync(normalizedPath);
  if (!stats.isFile()) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Set headers to force download (using content-disposition library for proper encoding)
  res.setHeader('Content-Disposition', contentDisposition(filename));
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing

  // Send the file
  res.sendFile(normalizedPath);
});

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Verify auth key endpoint (no auth required)
app.post('/verify-key', (req, res) => {
  verifyKey(req, res);
});

// Get list of downloaded files
app.get('/downloads-list', authMiddleware, (req, res) => {
  try {
    const files = fs.readdirSync(DOWNLOADS_DIR);
    const fileList = files.map(file => ({
      filename: file,
      downloadUrl: `http://localhost:${PORT}/downloads/${encodeURIComponent(file)}`,
      size: fs.statSync(path.join(DOWNLOADS_DIR, file)).size,
      created: fs.statSync(path.join(DOWNLOADS_DIR, file)).birthtime
    }));

    res.json(fileList);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Downloads directory: ${DOWNLOADS_DIR}`);
});
