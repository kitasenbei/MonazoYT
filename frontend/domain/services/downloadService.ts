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
      const error = await response.json();
      throw new Error(error.error || 'Failed to detect URL type');
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
      const error = await response.json();
      throw new Error(error.error || 'Download failed');
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
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch metadata');
    }

    return response.json();
  }

  static async checkHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  }
}
