import React, { useLayoutEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import About from './pages/About'
import Bookings from './pages/Bookings'
import Gallery from './pages/Gallery'
import Settings from './pages/Settings'
import Playlist from './pages/Playlist'
import Videos from './pages/Videos'
import Vibes from './pages/Vibes'
import Favorites from './pages/Favorites'
import { FavoritesProvider } from './context/FavoritesContext'
import { GlobalPlayerProvider } from './context/GlobalPlayerContext'
import GlobalMediaPanel from './components/GlobalMediaPanel'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useTheme } from './context/ThemeContext'
import './App.css'

function RouteScrollReset() {
  const { pathname } = useLocation()

  useLayoutEffect(() => {
    const scroller = document.querySelector('.main-viewport')
    scroller?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="page-transition-wrapper">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/playlist" element={<Playlist />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/vibes" element={<Vibes />} />
      </Routes>
    </div>
  )
}

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { sidebarPosition } = useTheme()

  return (
    <FavoritesProvider>
      <GlobalPlayerProvider>
        <BrowserRouter>
          <div className={`app-layout ${!sidebarOpen ? 'sidebar-hidden' : ''} ${sidebarPosition === 'right' ? 'sidebar-right' : ''}`}>
            <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <main className="main-viewport">
              <RouteScrollReset />
              {!sidebarOpen && (
                <button
                  className="sidebar-toggle-tab"
                  onClick={() => setSidebarOpen(true)}
                  title="Show sidebar"
                >
                  {sidebarPosition === 'right' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <AnimatedRoutes />
              <GlobalMediaPanel />
            </main>
          </div>
        </BrowserRouter>
      </GlobalPlayerProvider>
    </FavoritesProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
