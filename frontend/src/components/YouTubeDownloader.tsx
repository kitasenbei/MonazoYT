import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Loader2, Plus, Trash2, CheckCircle2, XCircle, List, LogOut, Settings2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DownloadService } from '../../domain/services/downloadService'
import { DownloadOptions } from './DownloadOptions'
import { AuthService } from '../../domain/services/authService'
import type { VideoMetadata, DetectResponse } from '../../domain/types/download'
import catGif from '../assets/cat.gif'

interface VideoItem {
  id: string
  url: string
  status: 'pending' | 'downloading' | 'completed' | 'failed'
  metadata?: VideoMetadata
  filename?: string
  downloadUrl?: string
  error?: string
  format?: string
  quality?: string
  progress?: number
  speed?: string
  eta?: string
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatViews(views?: number): string {
  if (!views) return ''
  if (views > 1000000) return `${(views / 1000000).toFixed(1)}M vistas`
  if (views > 1000) return `${(views / 1000).toFixed(1)}K vistas`
  return `${views} vistas`
}

export function YouTubeDownloader() {
  const [url, setUrl] = useState('')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [detectInfo, setDetectInfo] = useState<DetectResponse | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [editingVideo, setEditingVideo] = useState<string | null>(null)
  const videosPerPage = 10

  const handleURLPaste = async () => {
    if (!url.trim()) return

    setLoading(true)
    setLoadingMessage('Detectando URL...')
    setError('')

    try {
      // Detect URL type first
      const detection = await DownloadService.detectURL(url.trim())
      setDetectInfo(detection)
      setShowOptions(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al detectar URL')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleOptionsConfirm = async (options: { maxVideos: number; format: string; quality: string }) => {
    if (!url.trim() || !detectInfo) return

    setLoading(true)
    setLoadingMessage(detectInfo.isPlaylist
      ? `Obteniendo ${options.maxVideos} video${options.maxVideos > 1 ? 's' : ''} de la lista...`
      : 'Obteniendo detalles del video...')
    setError('')
    setShowOptions(false)

    try {
      // Fetch metadata with the specified limit
      const metadata = await DownloadService.getMetadata(url.trim(), options.maxVideos)

      if (metadata.isPlaylist && metadata.videos.length > 0) {
        // Add all videos from playlist
        const newVideos: VideoItem[] = metadata.videos.map((video, index) => ({
          id: `${Date.now()}-${index}`,
          url: video.url,
          status: 'pending',
          metadata: video,
          format: options.format,
          quality: options.quality
        }))
        setVideos(prev => {
          const updated = [...prev, ...newVideos]
          setCurrentPage(Math.ceil(updated.length / videosPerPage))
          return updated
        })
      } else if (metadata.videos.length > 0) {
        // Add single video
        const newVideo: VideoItem = {
          id: Date.now().toString(),
          url: metadata.videos[0].url,
          status: 'pending',
          metadata: metadata.videos[0],
          format: options.format,
          quality: options.quality
        }
        setVideos(prev => {
          const updated = [...prev, newVideo]
          setCurrentPage(Math.ceil(updated.length / videosPerPage))
          return updated
        })
      }

      setUrl('')
      setDetectInfo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar video')
      setShowOptions(true) // Show options again on error
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleOptionsCancel = () => {
    setShowOptions(false)
    setDetectInfo(null)
  }

  const removeFromQueue = (id: string) => {
    setVideos(prev => {
      const updated = prev.filter(v => v.id !== id)

      const newTotalPages = Math.ceil(updated.length / videosPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }

      if (updated.length === 0) {
        setCurrentPage(1)
      }

      return updated
    })
  }

  const updateVideoFormat = (id: string, format: string, quality: string) => {
    setVideos(prev => prev.map(v =>
      v.id === id ? { ...v, format, quality } : v
    ))
    setEditingVideo(null)
  }

  const handleDownload = async (id: string) => {
    const video = videos.find(v => v.id === id)
    if (!video) return

    const downloadId = `dl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    setVideos(prev => prev.map(v =>
      v.id === id ? { ...v, status: 'downloading', progress: 0 } : v
    ))

    // Start progress polling
    const progressInterval = setInterval(async () => {
      try {
        const progressData = await DownloadService.getProgress(downloadId)

        setVideos(prev => prev.map(v =>
          v.id === id
            ? {
                ...v,
                progress: progressData.progress,
                speed: progressData.speed,
                eta: progressData.eta
              }
            : v
        ))

        // Stop polling if completed or failed
        if (progressData.status === 'completed' || progressData.status === 'failed') {
          clearInterval(progressInterval)
        }
      } catch (err) {
        // Progress not available yet, continue polling
      }
    }, 500) // Poll every 500ms

    try {
      const data = await DownloadService.download({
        url: video.url,
        format: video.format as any,
        quality: video.quality as any,
        downloadId
      })

      clearInterval(progressInterval)

      if (data.status === 'completed' && data.downloadUrl) {
        setVideos(prev => prev.map(v =>
          v.id === id
            ? { ...v, status: 'completed', filename: data.filename, downloadUrl: data.downloadUrl, progress: 100 }
            : v
        ))

        // Auto-trigger download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.filename || 'video.mp4'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (err) {
      clearInterval(progressInterval)
      setVideos(prev => prev.map(v =>
        v.id === id
          ? { ...v, status: 'failed', error: err instanceof Error ? err.message : 'Error al descargar', progress: 0 }
          : v
      ))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && !showOptions) {
      handleURLPaste()
    }
  }

  // Pagination
  const totalPages = Math.ceil(videos.length / videosPerPage)
  const startIndex = (currentPage - 1) * videosPerPage
  const endIndex = startIndex + videosPerPage
  const currentVideos = videos.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleLogout = () => {
    AuthService.clearKey()
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-center">
                MonazoYT
              </CardTitle>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
          <CardDescription className="text-center text-base">
            Pega una URL de YouTube
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... o lista de reproducción"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-base h-12 flex-1"
                disabled={loading || showOptions}
              />
              <Button
                onClick={handleURLPaste}
                disabled={!url.trim() || loading || showOptions}
                size="lg"
                className="h-12 min-w-[60px]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </Button>
            </div>
            {loading && loadingMessage && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                <span className="font-medium">{loadingMessage}</span>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Download Options (shown when URL is detected) */}
          {showOptions && detectInfo && (
            <DownloadOptions
              isPlaylist={detectInfo.isPlaylist}
              playlistCount={detectInfo.playlistCount}
              title={detectInfo.title}
              onConfirm={handleOptionsConfirm}
              onCancel={handleOptionsCancel}
            />
          )}

          {/* Queue List */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Cola de descargas ({videos.length})
                </h3>
                {totalPages > 1 && (
                  <span className="text-xs text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {currentVideos.map((video) => (
                  <div
                    key={video.id}
                    className="flex gap-3 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    {/* Thumbnail */}
                    {video.metadata?.thumbnail && (
                      <div className="flex-shrink-0">
                        <img
                          src={video.metadata.thumbnail}
                          alt={video.metadata.title}
                          className="w-40 h-24 object-cover rounded"
                        />
                      </div>
                    )}

                    {/* Status Icon (if no thumbnail) */}
                    {!video.metadata?.thumbnail && (
                      <div className="flex-shrink-0 flex items-center justify-center w-12">
                        {video.status === 'downloading' && (
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        )}
                        {video.status === 'completed' && (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        )}
                        {video.status === 'failed' && (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        {video.status === 'pending' && (
                          <div className="h-6 w-6 rounded-full border-2 border-muted" />
                        )}
                      </div>
                    )}

                    {/* Video Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start gap-2">
                        {video.metadata?.thumbnail && (
                          <div className="flex-shrink-0 mt-0.5">
                            {video.status === 'downloading' && (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            )}
                            {video.status === 'completed' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {video.status === 'failed' && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {video.status === 'pending' && (
                              <div className="h-5 w-5 rounded-full border-2 border-muted" />
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2" title={video.metadata?.title}>
                            {video.metadata?.title || 'Cargando...'}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {video.metadata?.uploader && (
                          <span>{video.metadata.uploader}</span>
                        )}
                        {video.metadata?.duration && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(video.metadata.duration)}</span>
                          </>
                        )}
                        {video.metadata?.view_count && (
                          <>
                            <span>•</span>
                            <span>{formatViews(video.metadata.view_count)}</span>
                          </>
                        )}
                        {video.format && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary font-medium">
                              {video.format.toUpperCase()}
                            </span>
                          </>
                        )}
                        {video.quality && video.format !== 'mp3' && (
                          <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary font-medium">
                            {video.quality === 'audio' ? 'Solo Audio' : `${video.quality}p`}
                          </span>
                        )}
                      </div>

                      {video.status === 'downloading' && video.progress !== undefined && (
                        <div className="space-y-1 pt-2">
                          <Progress value={video.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{video.progress.toFixed(1)}%</span>
                            <div className="flex gap-3">
                              {video.speed && <span>{video.speed}</span>}
                              {video.eta && <span>ETA: {video.eta}</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {video.filename && (
                        <p className="text-xs text-muted-foreground truncate">
                          📁 {video.filename}
                        </p>
                      )}
                      {video.error && (
                        <p className="text-xs text-destructive">
                          {video.error}
                        </p>
                      )}

                      {/* Format/Quality Editor */}
                      {video.status === 'pending' && editingVideo === video.id && (
                        <div className="pt-2 flex gap-2 items-center">
                          <Select
                            value={video.format}
                            onValueChange={(newFormat) => {
                              const newQuality = newFormat === 'mp3' ? video.quality : video.quality || '1080'
                              updateVideoFormat(video.id, newFormat, newQuality)
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mp4">Video MP4</SelectItem>
                              <SelectItem value="mp3">Audio MP3</SelectItem>
                              <SelectItem value="webm">Video WebM</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={video.quality}
                            onValueChange={(newQuality) => updateVideoFormat(video.id, video.format || 'mp4', newQuality)}
                            disabled={video.format === 'mp3'}
                          >
                            <SelectTrigger className="h-8 text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2160">4K</SelectItem>
                              <SelectItem value="1440">2K</SelectItem>
                              <SelectItem value="1080">1080p</SelectItem>
                              <SelectItem value="720">720p</SelectItem>
                              <SelectItem value="480">480p</SelectItem>
                              <SelectItem value="360">360p</SelectItem>
                              <SelectItem value="audio">Solo Audio</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="ghost" onClick={() => setEditingVideo(null)}>
                            ✓
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 items-center">
                      {video.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingVideo(editingVideo === video.id ? null : video.id)}
                          >
                            <Settings2 className="h-4 w-4 mr-1" />
                            Cambiar formato
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(video.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromQueue(video.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {video.status === 'completed' && video.downloadUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={video.downloadUrl} download={video.filename}>
                            <Download className="h-4 w-4 mr-1" />
                            Descargar de nuevo
                          </a>
                        </Button>
                      )}
                      {video.status === 'failed' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(video.id)}
                          >
                            Reintentar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromQueue(video.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)

                      if (!showPage) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-muted-foreground">...</span>
                        }
                        return null
                      }

                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? 'default' : 'outline'}
                          onClick={() => handlePageChange(page)}
                          className="w-9"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}

          {videos.length === 0 && !showOptions && (
            <div className="text-center py-12 text-muted-foreground space-y-4">
              <img src={catGif} alt="cat" className="w-32 h-32 mx-auto rounded-lg opacity-60" />
              <p className="text-sm">Sin videos en cola</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
