import { useState, useEffect } from 'react'
import { YouTubeDownloader } from './components/YouTubeDownloader'
import { Login } from './components/Login'
import { AuthService } from '../domain/services/authService'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated())
  }, [])

  const handleLogin = (key: string) => {
    AuthService.saveKey(key)
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return <YouTubeDownloader />
}

export default App
