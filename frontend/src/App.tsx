import { useState, useEffect } from 'react'
import { Login } from './components/Login'
import { AuthService } from '../domain/services/authService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Youtube } from 'lucide-react'
import { YouTubeTab } from './components/tabs/YouTubeTab'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated())
  }, [])

  const handleLogin = (key: string) => {
    AuthService.saveKey(key)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    AuthService.clearKey()
    window.location.reload()
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-6xl shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2">
                <Youtube className="h-8 w-8 text-red-600" />
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
            Descarga videos y audios de YouTube fácilmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YouTubeTab />
        </CardContent>
      </Card>
    </div>
  )
}

export default App
