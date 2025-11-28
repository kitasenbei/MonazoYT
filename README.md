# MonazoYT

Private YouTube video downloader with format/quality selection and queue management.

## Project Structure

```
downpe/
├── frontend/           # React + Vite frontend
│   ├── domain/         # Domain layer (types, services)
│   │   ├── types/      # TypeScript types
│   │   └── services/   # Business logic services
│   ├── src/
│   │   ├── components/ # React components (including shadcn/ui)
│   │   └── lib/        # Utility functions
│   └── .env            # Environment variables
│
└── backend/            # Express.js backend
    ├── index.js        # Main server file
    ├── downloads/      # Downloaded videos storage
    └── .env            # Environment variables
```

## Prerequisites

### System Requirements

1. **Node.js** (v18 or higher)
2. **yt-dlp** (system-level installation)

### Installing yt-dlp

**Linux/Mac:**
```bash
# Using pip
pip install yt-dlp

# Or using your package manager
# Ubuntu/Debian:
sudo apt install yt-dlp

# macOS:
brew install yt-dlp
```

**Windows:**
```bash
# Using pip
pip install yt-dlp

# Or download from GitHub releases
# https://github.com/yt-dlp/yt-dlp/releases
```

Verify installation:
```bash
yt-dlp --version
```

## Setup

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - The `.env` file should already exist with:
   ```
   VITE_API_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - The `.env` file should already exist with:
   ```
   PORT=3000
   ```

4. Run the server:
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:3000`

## Usage

1. Start both frontend and backend servers
2. Open `http://localhost:5173` in your browser
3. Enter your access key (see Authentication section)
4. Paste a YouTube URL (video or playlist)
5. Configure format and quality options
6. Add videos to queue and download

For authentication setup, see `backend/AUTH_README.md`

## Features

- ✅ **SHA256 key-based authentication** ("monkey auth")
- ✅ **Single video and playlist support** with smart detection
- ✅ **Format selection**: MP4, MP3, WebM
- ✅ **Quality selection**: 4K, 2K, 1080p, 720p, 480p, 360p, audio-only
- ✅ **Download queue** with pagination (10 items per page)
- ✅ **Per-video format editing** before download
- ✅ **Real-time progress tracking** with speed and ETA
- ✅ **Spanish UI** (localized interface)
- ✅ Modern UI with shadcn/ui components
- ✅ Domain-driven architecture with TypeScript
- ✅ **Comprehensive security** (rate limiting, URL validation, sanitization)

## Security Features

The backend includes multiple layers of security:

- **URL Validation**: Whitelist of allowed domains (YouTube, Vimeo, etc.)
- **Rate Limiting**:
  - Metadata: 20 requests/minute
  - Downloads: 10 downloads/5 minutes
- **Filename Sanitization**: Prevents path traversal and injection attacks
- **Resource Limits**:
  - Max file size: 500MB
  - Max video quality: 1080p
  - Max playlist items: 100
- **Timeouts**: Prevents hanging processes
- **Path Traversal Protection**: All file operations validated

See [SECURITY.md](./SECURITY.md) for complete security documentation.

## API Endpoints

### Backend

**Public endpoints:**
- `GET /health` - Health check endpoint
- `POST /verify-key` - Verify authentication key
- `GET /downloads/:filename` - Serve downloaded file (no auth required)

**Protected endpoints** (require `x-auth-key` header):
- `POST /detect` - Detect if URL is playlist
- `POST /metadata` - Get video/playlist metadata
- `POST /download` - Download video with format/quality options
- `GET /progress/:downloadId` - Get download progress
- `GET /downloads-list` - List all downloaded files

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- shadcn/ui (New York style)
- Tailwind CSS
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- CORS
- dotenv
- yt-dlp (system command)

## Configuration

### Video Quality

The backend is configured to download the best quality MP4 video by default. You can modify the yt-dlp options in `backend/index.js`:

```javascript
const ytdlp = spawn('yt-dlp', [
  '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  '--merge-output-format', 'mp4',
  // ... other options
]);
```

## Troubleshooting

### yt-dlp not found
- Make sure yt-dlp is installed and available in your PATH
- Run `yt-dlp --version` to verify

### Download fails
- Check if the YouTube URL is valid
- Check backend console for yt-dlp error messages
- Some videos may be region-restricted or age-restricted

### CORS errors
- Make sure backend is running on port 3000
- Check that `VITE_API_URL` in frontend/.env matches your backend URL
