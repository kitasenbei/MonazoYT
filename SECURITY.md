# Security Measures

This document outlines the security measures implemented in the YouTube Downloader backend.

## 1. URL Validation and Whitelisting

### Domain Whitelist
Only the following video platforms are allowed:
- YouTube (youtube.com, youtu.be, m.youtube.com, music.youtube.com)
- Vimeo (vimeo.com)
- Dailymotion (dailymotion.com)
- Twitch (twitch.tv)

### Validation Checks
- ✅ Valid URL format (http/https protocol required)
- ✅ Domain whitelist enforcement
- ✅ YouTube-specific validation (video ID or playlist ID required)
- ✅ Rejects malicious or invalid URLs

**Location:** `backend/security.js` - `isValidVideoURL()`

## 2. Filename Sanitization

### Protection Against
- Path traversal attacks (`../`, `..\\`)
- Null byte injection (`\0`)
- Control characters
- Path separators in filenames

### Implementation
- Removes all path traversal attempts
- Strips dangerous characters
- Limits filename length to 255 characters
- Provides safe default if sanitization results in empty string

**Location:** `backend/security.js` - `sanitizeFilename()`

## 3. Path Traversal Prevention

### Download Endpoint
- Normalizes all file paths
- Verifies files are within `DOWNLOADS_DIR`
- Checks file existence before serving
- Verifies target is a file (not directory)
- Returns 403 Forbidden for invalid paths

**Location:** `backend/index.js` - `/downloads/:filename` endpoint

## 4. Rate Limiting

### Metadata Endpoint
- **Limit:** 20 requests per minute
- **Window:** 1 minute
- Prevents metadata scraping abuse

### Download Endpoint
- **Limit:** 10 downloads per 5 minutes
- **Window:** 5 minutes
- Prevents bandwidth abuse and server overload

**Location:** `backend/index.js` - `metadataLimiter`, `downloadLimiter`

## 5. Resource Limits

### File Size
- **Maximum:** 500MB per video
- Prevents disk space exhaustion
- Option: `--max-filesize 500M`

### Video Quality
- **Maximum:** 1080p resolution
- Reduces bandwidth and storage usage
- Format: `bestvideo[height<=1080]`

### Playlist Limits
- **Maximum:** 100 videos per playlist
- Validated and bounded in `validateLimit()`
- Default: 50 videos

### Timeouts
- **Metadata fetch:** 30 seconds
- **Download:** 5 minutes (300 seconds)
- **Socket timeout:** 30 seconds
- Prevents hanging processes

**Location:** `backend/index.js` - yt-dlp spawn options

## 6. Process Security

### yt-dlp Spawn Options
```javascript
{
  timeout: 300000,      // Process timeout
  windowsHide: true     // Hide console window on Windows
}
```

### Download Restrictions
- `--no-playlist` flag on download endpoint (single videos only)
- `--socket-timeout 30` to prevent hanging connections
- `--no-check-certificate` with secure URL validation

## 7. HTTP Security Headers

### File Download
- `Content-Disposition: attachment` - Forces download
- `Content-Type: application/octet-stream` - Prevents execution
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing

**Location:** `backend/index.js` - `/downloads/:filename` endpoint

## 8. Input Validation

### All Endpoints
- URL parameter validation
- Limit parameter validation and bounding
- Empty/null checks
- Type validation

### Error Handling
- Never exposes internal errors to client
- Logs security events server-side
- Returns generic error messages

## 9. CORS Configuration

Current configuration allows all origins. For production, consider:

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
```

## 10. File System Security

### Downloads Directory
- Created with restricted permissions
- All files verified to be within this directory
- No execution permissions on downloaded files
- Regular cleanup recommended (implement auto-delete)

## Security Checklist for Production

- [ ] Set `ALLOWED_ORIGIN` in environment variables
- [ ] Implement HTTPS (TLS/SSL)
- [ ] Add authentication/API keys
- [ ] Implement automatic file cleanup (delete after X hours)
- [ ] Add disk space monitoring
- [ ] Set up logging and monitoring
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Enable firewall rules
- [ ] Regular security audits
- [ ] Keep yt-dlp updated

## Known Limitations

1. **No authentication** - Anyone can access the API
2. **No file cleanup** - Downloaded files accumulate
3. **Local IP in download URLs** - Not suitable for public deployment
4. **No encryption at rest** - Files stored unencrypted

## Recommended Improvements

1. Add JWT authentication
2. Implement automatic file cleanup after 24 hours
3. Add disk usage monitoring and limits
4. Use signed URLs for downloads
5. Implement request logging and analytics
6. Add honeypot endpoints to detect scanners
7. Implement CAPTCHA for public deployments

## Reporting Security Issues

If you discover a security vulnerability, please email: [your-email@example.com]
