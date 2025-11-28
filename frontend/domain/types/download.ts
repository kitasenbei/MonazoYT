export interface DownloadRequest {
  url: string;
  format?: 'mp4' | 'mp3' | 'webm';
  quality?: '2160' | '1440' | '1080' | '720' | '480' | '360' | 'audio';
}

export interface DownloadResponse {
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename?: string;
  downloadUrl?: string;
}

export interface DownloadError {
  error: string;
  details?: string;
}

export interface VideoMetadata {
  url: string;
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  view_count?: number;
  upload_date?: string;
  description?: string;
  ext?: string;
}

export interface MetadataResponse {
  isPlaylist: boolean;
  videos: VideoMetadata[];
}

export interface DetectResponse {
  isPlaylist: boolean;
  playlistCount: number;
  title?: string;
  uploader?: string;
}
