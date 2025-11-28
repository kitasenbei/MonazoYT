import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { List, Video, Music } from 'lucide-react'

interface DownloadOptionsProps {
  isPlaylist: boolean
  playlistCount: number
  title?: string
  onConfirm: (options: { maxVideos: number; format: string; quality: string }) => void
  onCancel: () => void
}

export function DownloadOptions({ isPlaylist, playlistCount, title, onConfirm, onCancel }: DownloadOptionsProps) {
  const [maxVideos, setMaxVideos] = useState(Math.min(playlistCount, 20))
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('1080')

  const handleConfirm = () => {
    onConfirm({ maxVideos, format, quality })
  }

  return (
    <Card className="border-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isPlaylist ? (
            <>
              <List className="h-5 w-5" />
              Lista de reproducción detectada
            </>
          ) : (
            <>
              <Video className="h-5 w-5" />
              Video detectado
            </>
          )}
        </CardTitle>
        {title && <p className="text-sm text-muted-foreground">{title}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {isPlaylist && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Videos máximo</label>
              <span className="text-sm text-muted-foreground">{maxVideos} de {playlistCount}</span>
            </div>
            <Slider
              value={[maxVideos]}
              onValueChange={(value) => setMaxVideos(value[0])}
              min={1}
              max={Math.min(playlistCount, 100)}
              step={1}
              className="w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video MP4
                  </div>
                </SelectItem>
                <SelectItem value="mp3">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Audio MP3
                  </div>
                </SelectItem>
                <SelectItem value="webm">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video WebM
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Calidad</label>
            <Select value={quality} onValueChange={setQuality} disabled={format === 'mp3'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2160">4K (2160p)</SelectItem>
                <SelectItem value="1440">2K (1440p)</SelectItem>
                <SelectItem value="1080">Full HD (1080p)</SelectItem>
                <SelectItem value="720">HD (720p)</SelectItem>
                <SelectItem value="480">SD (480p)</SelectItem>
                <SelectItem value="360">Low (360p)</SelectItem>
                <SelectItem value="audio">Solo Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleConfirm} className="flex-1">
            Agregar a la cola
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
