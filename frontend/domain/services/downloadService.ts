import type { DownloadRequest, DownloadResponse, MetadataResponse, DetectResponse } from '../types/download';
import { AuthService } from './authService';

const API_URL = import.meta.env.VITE_API_URL;

export class DownloadService {
  private static getAuthHeaders(): HeadersInit {
    const key = AuthService.getKey();
    return {
      'Content-Type': 'application/json',
      ...(key && { 'x-auth-key': key }),
    };
  }
  static async detectURL(url: string): Promise<DetectResponse> {
    const response = await fetch(`${API_URL}/api/youtube/detect`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to detect URL type';
      try {
        const error = await response.json();
        errorMessage = error.error || error.details || errorMessage;
      } catch {
        errorMessage = `Failed to detect URL: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async download(request: DownloadRequest & { downloadId?: string }): Promise<DownloadResponse> {
    const response = await fetch(`${API_URL}/api/youtube/download`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = 'Download failed';
      try {
        const error = await response.json();
        errorMessage = error.error || error.details || errorMessage;
      } catch {
        errorMessage = `Download failed: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async getProgress(downloadId: string): Promise<{ progress: number; speed: string; eta: string; status: string }> {
    const key = AuthService.getKey();
    const response = await fetch(`${API_URL}/api/youtube/progress/${downloadId}`, {
      headers: key ? { 'x-auth-key': key } : {},
    });

    if (!response.ok) {
      throw new Error('Progress not available');
    }

    return response.json();
  }

  static async getMetadata(url: string, limit: number = 50): Promise<MetadataResponse> {
    const response = await fetch(`${API_URL}/api/youtube/metadata`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ url, limit }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch metadata';
      try {
        const error = await response.json();
        errorMessage = error.error || error.details || errorMessage;
      } catch {
        errorMessage = `Failed to fetch metadata: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  static async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  }
}
