const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { isValidVideoURL, sanitizeFilename, validateLimit } = require('../security');

const router = express.Router();

// Get downloads directory from parent
const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

// Download cooldown tracking (shared state for this service)
let downloadCount = 0;
const COOLDOWN_THRESHOLD = 5;
const COOLDOWN_MIN = 60000;
const COOLDOWN_MAX = 120000;

// Store active downloads for progress tracking
const activeDownloads = new Map();

// Rate limiting for metadata endpoint
const metadataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Too many metadata requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for download endpoint
const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Too many download requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to get cookies path
function getCookiesPath() {
  const cookiesPath = path.join(__dirname, '..', 'youtube_cookies.txt');
  return fs.existsSync(cookiesPath) ? cookiesPath : null;
}

// Detect if URL is a playlist
router.post('/detect', metadataLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    console.log('🔍 [YouTube] Detecting URL type:', url);

    const detectArgs = [
      '--flat-playlist',
      '--dump-single-json',
      '-I', '0',
      '--quiet',
      '--no-warnings',
      '--extractor-args', 'youtubetab:skip=authcheck'
    ];

    const cookiesPath = getCookiesPath();
    if (cookiesPath) {
      detectArgs.push('--cookies', cookiesPath);
    }

    detectArgs.push(url);

    const ytdlp = spawn('yt-dlp', detectArgs, {
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
          console.error('✗ [YouTube] Failed to parse detect response:', parseError);
          res.status(500).json({ error: 'Failed to detect URL type' });
        }
      } else {
        console.error('✗ [YouTube] Detection failed:', errorOutput || 'Unknown error');
        res.status(500).json({
          error: 'Failed to detect URL type',
          details: errorOutput || 'Unknown error occurred'
        });
      }
    });

  } catch (error) {
    console.error('[YouTube] Detection error:', error);
    res.status(500).json({ error: 'Failed to detect URL type', details: error.message });
  }
});

// Get video metadata
router.post('/metadata', metadataLimiter, async (req, res) => {
  try {
    const { url, limit = 50 } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    const validLimit = validateLimit(limit);

    console.log('📋 [YouTube] Fetching metadata for:', url);

    const metadataArgs = [
      '--dump-json',
      '--playlist-end', validLimit.toString(),
      '--quiet',
      '--no-warnings',
      '--no-check-certificate',
      '--extractor-args', 'youtubetab:skip=authcheck'
    ];

    const cookiesPath = getCookiesPath();
    if (cookiesPath) {
      metadataArgs.push('--cookies', cookiesPath);
    }

    metadataArgs.push(url);

    const ytdlp = spawn('yt-dlp', metadataArgs, {
      windowsHide: true
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
      console.log(`[YouTube] yt-dlp exited with code ${code}, output length: ${metadataOutput.length}, error length: ${errorOutput.length}`);

      if (code === 0 && metadataOutput) {
        try {
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

          console.log(`✓ [YouTube] Fetched metadata for ${videos.length} video(s)`);

          res.json({
            isPlaylist: videos.length > 1,
            videos
          });
        } catch (parseError) {
          console.error('✗ [YouTube] Failed to parse metadata:', parseError);
          res.status(500).json({ error: 'Failed to parse video metadata' });
        }
      } else {
        console.error('✗ [YouTube] Metadata fetch failed:', errorOutput || 'Unknown error');
        console.error('✗ [YouTube] Exit code:', code);
        res.status(500).json({
          error: 'Failed to fetch video metadata',
          details: errorOutput || 'Unknown error occurred'
        });
      }
    });

  } catch (error) {
    console.error('[YouTube] Metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
});

// Download endpoint
router.post('/download', downloadLimiter, async (req, res) => {
  try {
    const { url, format = 'mp4', quality = '1080', downloadId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidVideoURL(url)) {
      return res.status(400).json({ error: 'Invalid or unsupported video URL' });
    }

    // Cooldown logic
    if (downloadCount > 0 && downloadCount % COOLDOWN_THRESHOLD === 0) {
      const cooldownTime = Math.floor(Math.random() * (COOLDOWN_MAX - COOLDOWN_MIN + 1) + COOLDOWN_MIN);
      const cooldownSeconds = Math.floor(cooldownTime / 1000);
      console.log(`⏸️  [YouTube] Cooldown: Waiting ${cooldownSeconds}s after ${downloadCount} downloads`);

      if (downloadId) {
        activeDownloads.set(downloadId, {
          progress: 0,
          speed: '',
          eta: `Cooldown: ${cooldownSeconds}s`,
          status: 'cooldown'
        });
      }

      await new Promise(resolve => setTimeout(resolve, cooldownTime));
    }

    console.log('⬇ [YouTube] Downloading:', url, `[${format}, ${quality}]`);

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

    const outputTemplate = path.join(DOWNLOADS_DIR, '%(title).200s.%(ext)s');

    if (downloadId) {
      activeDownloads.set(downloadId, {
        progress: 0,
        speed: '',
        eta: '',
        status: 'downloading'
      });
    }

    const ytdlpArgs = [
      '-f', formatString,
      '--progress',
      '--newline',
      '--no-warnings',
      '--max-filesize', '500M',
      '--socket-timeout', '30',
      '--no-check-certificate',
      '--no-playlist',
      '-o', outputTemplate,
      '--print', 'after_move:filepath'
    ];

    if (format === 'mp3') {
      ytdlpArgs.push(
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0'
      );
    } else if (format === 'mp4') {
      ytdlpArgs.push('--merge-output-format', 'mp4');
    } else if (format === 'webm') {
      ytdlpArgs.push('--merge-output-format', 'webm');
    }

    const cookiesPath = getCookiesPath();
    if (cookiesPath) {
      ytdlpArgs.push('--cookies', cookiesPath);
    }

    ytdlpArgs.push(url);

    const ytdlp = spawn('yt-dlp', ytdlpArgs, {
      windowsHide: true
    });

    let downloadedFile = '';
    let errorOutput = '';

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString().trim();
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%(?:\s+of\s+[\d\.]+\w+)?(?:\s+at\s+([\d\.]+\w+\/s))?(?:\s+ETA\s+([\d:]+))?/);

      if (progressMatch && downloadId) {
        activeDownloads.set(downloadId, {
          progress: parseFloat(progressMatch[1]),
          speed: progressMatch[2] || '',
          eta: progressMatch[3] || '',
          status: 'downloading'
        });
      }

      if (output.includes(DOWNLOADS_DIR)) {
        downloadedFile = output;
        console.log('✓ [YouTube] Download completed:', path.basename(output));

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
      errorOutput += data.toString();
    });

    ytdlp.on('close', (code) => {
      if (downloadId) {
        setTimeout(() => activeDownloads.delete(downloadId), 5000);
      }

      if (code === 0 && downloadedFile) {
        let filename = sanitizeFilename(path.basename(downloadedFile));
        const actualPath = path.join(DOWNLOADS_DIR, filename);
        const normalizedPath = path.normalize(actualPath);

        if (!normalizedPath.startsWith(path.normalize(DOWNLOADS_DIR))) {
          console.error('✗ [YouTube] Security: Path traversal attempt');
          if (downloadId) activeDownloads.delete(downloadId);
          return res.status(500).json({ error: 'Download failed', details: 'Invalid file path' });
        }

        if (!fs.existsSync(normalizedPath)) {
          console.error('✗ [YouTube] Download file not found:', normalizedPath);
          if (downloadId) activeDownloads.delete(downloadId);
          return res.status(500).json({ error: 'Download failed', details: 'Downloaded file not found' });
        }

        const downloadUrl = `${req.protocol}://${req.get('host')}/downloads/${encodeURIComponent(filename)}`;

        downloadCount++;
        console.log(`📊 [YouTube] Download count: ${downloadCount}`);

        res.json({
          message: 'Download completed',
          status: 'completed',
          filename,
          downloadUrl
        });
      } else {
        console.error('✗ [YouTube] Download failed:', errorOutput || 'Unknown error');
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
    console.error('[YouTube] Download error:', error);
    res.status(500).json({ error: 'Download failed', details: error.message });
  }
});

// Progress endpoint
router.get('/progress/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const progress = activeDownloads.get(downloadId);

  if (!progress) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json(progress);
});

module.exports = router;
