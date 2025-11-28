const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const contentDisposition = require('content-disposition');
const { isValidVideoURL, sanitizeFilename, validateLimit } = require('./security');
const { authMiddleware, verifyKey } = require('./auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');

// Create downloads directory if it doesn't exist
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Rate limiting for metadata endpoint (more generous)
const metadataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many metadata requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for download endpoint (stricter)
const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 downloads per 5 minutes
  message: { error: 'Too many download requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Detect if URL is a playlist (quick check)
app.post('/detect', authMiddleware, metadataLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    console.log('🔍 Detecting URL type:', url);

    // Use yt-dlp to quickly detect playlist (using -I 0 to get playlist metadata without processing videos)
    const ytdlp = spawn('yt-dlp', [
      '--flat-playlist',
      '--dump-single-json',
      '-I', '0',
      '--quiet',
      '--no-warnings',
      url
    ], {
      timeout: 10000, // 10 second timeout
      windowsHide: true
    });

    let output = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0 && output) {
        try {
          const data = JSON.parse(output);
          const isPlaylist = data._type === 'playlist' && data.entries && data.entries.length > 0;
          const playlistCount = isPlaylist ? (data.playlist_count || data.entries.length) : 0;

          res.json({
            isPlaylist,
            playlistCount,
            title: data.title,
            uploader: data.uploader || data.channel
          });
        } catch (parseError) {
          console.error('✗ Failed to parse detect response:', parseError);
          res.status(500).json({ error: 'Failed to detect URL type' });
        }
      } else {
        console.error('✗ Detection failed:', errorOutput || 'Unknown error');
        res.status(500).json({
          error: 'Failed to detect URL type',
          details: errorOutput || 'Unknown error occurred'
        });
      }
    });

  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: 'Failed to detect URL type', details: error.message });
  }
});

// Get video metadata endpoint (supports playlists)
app.post('/metadata', authMiddleware, metadataLimiter, async (req, res) => {
  try {
    const { url, limit = 50 } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    // Validate and sanitize limit
    const validLimit = validateLimit(limit);

    console.log('📋 Fetching metadata for:', url);

    // Use yt-dlp to get video metadata (handles both single videos and playlists)
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--flat-playlist',
      '--playlist-end', validLimit.toString(),
      '--quiet',
      '--no-warnings',
      '--no-check-certificate', // Avoid certificate issues but still secure
      url
    ], {
      timeout: 30000, // 30 second timeout
      windowsHide: true // Hide console window on Windows
    });

    let metadataOutput = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      metadataOutput += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0 && metadataOutput) {
        try {
          // Parse each line as separate JSON (for playlists)
          const lines = metadataOutput.trim().split('\n').filter(line => line.trim());
          const videos = lines.map(line => {
            const metadata = JSON.parse(line);
            return {
              url: metadata.url || `https://www.youtube.com/watch?v=${metadata.id}`,
              title: metadata.title,
              thumbnail: metadata.thumbnail || metadata.thumbnails?.[0]?.url,
              duration: metadata.duration,
              uploader: metadata.uploader || metadata.channel,
              view_count: metadata.view_count,
              upload_date: metadata.upload_date,
              description: metadata.description,
              ext: metadata.ext
            };
          });

          console.log(`✓ Fetched metadata for ${videos.length} video(s)`);

          res.json({
            isPlaylist: videos.length > 1,
            videos
          });
        } catch (parseError) {
          console.error('✗ Failed to parse metadata:', parseError);
          res.status(500).json({ error: 'Failed to parse video metadata' });
        }
      } else {
        console.error('✗ Metadata fetch failed:', errorOutput || 'Unknown error');
        res.status(500).json({
          error: 'Failed to fetch video metadata',
          details: errorOutput || 'Unknown error occurred'
        });
      }
    });

  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
});

// Store active downloads for progress tracking
const activeDownloads = new Map();

// Download endpoint with progress streaming
app.post('/download', authMiddleware, downloadLimiter, async (req, res) => {
  try {
    const { url, format = 'mp4', quality = '1080', downloadId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL
    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    console.log('⬇ Downloading:', url, `[${format}, ${quality}]`);

    // Build format string based on user selection
    let formatString;
    let outputExt = format;

    switch (format) {
      case 'mp3':
        formatString = 'bestaudio/best';
        outputExt = 'mp3';
        break;
      case 'mp4':
        formatString = quality === 'audio'
          ? 'bestaudio/best'
          : `bestvideo[ext=mp4][height<=${quality}]+bestaudio[ext=m4a]/best[ext=mp4][height<=${quality}]/best`;
        break;
      case 'webm':
        formatString = quality === 'audio'
          ? 'bestaudio[ext=webm]/bestaudio'
          : `bestvideo[ext=webm][height<=${quality}]+bestaudio[ext=webm]/best[ext=webm][height<=${quality}]/best`;
        break;
      default:
        formatString = `bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best`;
    }

    // Output template for yt-dlp with sanitized filename
    const outputTemplate = path.join(DOWNLOADS_DIR, '%(title).200s.%(ext)s');

    // Initialize progress tracking for this download
    if (downloadId) {
      activeDownloads.set(downloadId, {
        progress: 0,
        speed: '',
        eta: '',
        status: 'downloading'
      });
    }

    // Base args (enable progress output)
    const ytdlpArgs = [
      '-f', formatString,
      '--progress', // Enable progress output
      '--newline', // Progress on separate lines
      '--no-warnings',
      '--max-filesize', '500M', // Max 500MB file size
      '--socket-timeout', '30', // 30 second socket timeout
      '--no-check-certificate',
      '--no-playlist', // Download single video only, not playlists
      '-o', outputTemplate,
      '--print', 'after_move:filepath'
    ];

    // Add format-specific options
    if (format === 'mp3') {
      ytdlpArgs.push(
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0' // Best quality
      );
    } else if (format === 'mp4') {
      ytdlpArgs.push('--merge-output-format', 'mp4');
    } else if (format === 'webm') {
      ytdlpArgs.push('--merge-output-format', 'webm');
    }

    ytdlpArgs.push(url);

    // Spawn yt-dlp process with security options
    const ytdlp = spawn('yt-dlp', ytdlpArgs, {
      timeout: 300000, // 5 minute timeout for download
      windowsHide: true
    });

    let downloadedFile = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString().trim();

      // Parse progress: [download]  45.3% of 123.45MiB at 1.23MiB/s ETA 00:32
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%(?:\s+of\s+[\d\.]+\w+)?(?:\s+at\s+([\d\.]+\w+\/s))?(?:\s+ETA\s+([\d:]+))?/);

      if (progressMatch && downloadId) {
        const progress = parseFloat(progressMatch[1]);
        const speed = progressMatch[2] || '';
        const eta = progressMatch[3] || '';

        activeDownloads.set(downloadId, {
          progress,
          speed,
          eta,
          status: 'downloading'
        });
      }

      // Capture the final filepath
      if (output.includes(DOWNLOADS_DIR)) {
        downloadedFile = output;
        console.log('✓ Download completed:', path.basename(output));

        if (downloadId) {
          activeDownloads.set(downloadId, {
            progress: 100,
            speed: '',
            eta: '',
            status: 'completed'
          });
        }
      }
    });

    ytdlp.stderr.on('data', (data) => {
      const error = data.toString();
      errorOutput += error;
    });

    ytdlp.on('close', (code) => {
      // Clean up progress tracking
      if (downloadId) {
        setTimeout(() => {
          activeDownloads.delete(downloadId);
        }, 5000); // Keep for 5s to allow final progress checks
      }

      if (code === 0 && downloadedFile) {
        // Extract and sanitize filename
        let filename = path.basename(downloadedFile);
        filename = sanitizeFilename(filename);

        // Verify the file actually exists and is in the correct directory
        const actualPath = path.join(DOWNLOADS_DIR, filename);
        const normalizedPath = path.normalize(actualPath);

        // Prevent path traversal - ensure file is within DOWNLOADS_DIR
        if (!normalizedPath.startsWith(path.normalize(DOWNLOADS_DIR))) {
          console.error('✗ Security: Path traversal attempt detected');
          if (downloadId) activeDownloads.delete(downloadId);
          return res.status(500).json({
            error: 'Download failed',
            details: 'Invalid file path'
          });
        }

        // Check file exists
        if (!fs.existsSync(normalizedPath)) {
          console.error('✗ Download file not found:', normalizedPath);
          if (downloadId) activeDownloads.delete(downloadId);
          return res.status(500).json({
            error: 'Download failed',
            details: 'Downloaded file not found'
          });
        }

        const downloadUrl = `http://localhost:${PORT}/downloads/${encodeURIComponent(filename)}`;

        res.json({
          message: 'Download completed',
          status: 'completed',
          filename,
          downloadUrl
        });
      } else {
        console.error('✗ Download failed:', errorOutput || 'Unknown error');
        if (downloadId) {
          activeDownloads.set(downloadId, {
            progress: 0,
            speed: '',
            eta: '',
            status: 'failed'
          });
        }
        res.status(500).json({
          error: 'Download failed',
          details: errorOutput || 'Unknown error occurred',
          status: 'failed'
        });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

// Progress endpoint (polling)
app.get('/progress/:downloadId', authMiddleware, (req, res) => {
  const { downloadId } = req.params;

  const progress = activeDownloads.get(downloadId);

  if (!progress) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json(progress);
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
