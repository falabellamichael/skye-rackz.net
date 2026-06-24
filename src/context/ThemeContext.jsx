import React, { createContext, useContext, useState, useEffect } from 'react'

// Preset themes inspired by Odysseus
const THEMES = {
  neonPink: {
    name: 'Neon Pink',
    bg: '#000000',
    fg: '#ffffff',
    accent: '#FF007F',
    panel: '#050505',
    border: 'rgba(255, 0, 127, 0.2)',
  },
  midnight: {
    name: 'Midnight',
    bg: '#0d1117',
    fg: '#c9d1d9',
    accent: '#f85149',
    panel: '#161b22',
    border: 'rgba(248, 81, 73, 0.2)',
  },
  cyberpunk: {
    name: 'Cyberpunk',
    bg: '#0a0a0f',
    fg: '#0ff0fc',
    accent: '#e040fb',
    panel: '#12101a',
    border: 'rgba(224, 64, 251, 0.2)',
  },
  retrowave: {
    name: 'Retrowave',
    bg: '#1a1a2e',
    fg: '#e94560',
    accent: '#e94560',
    panel: '#16213e',
    border: 'rgba(233, 69, 96, 0.2)',
  },
  ocean: {
    name: 'Ocean',
    bg: '#0b1a2c',
    fg: '#64d2ff',
    accent: '#4facfe',
    panel: '#091422',
    border: 'rgba(79, 172, 254, 0.2)',
  },
  forest: {
    name: 'Forest',
    bg: '#1b2a1b',
    fg: '#a8d5a2',
    accent: '#7cb871',
    panel: '#142414',
    border: 'rgba(124, 184, 113, 0.2)',
  },
  lavender: {
    name: 'Lavender',
    bg: '#2b1b2e',
    fg: '#f5c2e7',
    accent: '#9b6dcc',
    panel: '#1e1420',
    border: 'rgba(155, 109, 204, 0.2)',
  },
  copper: {
    name: 'Copper',
    bg: '#1c1410',
    fg: '#e8c39e',
    accent: '#d4764e',
    panel: '#140f0a',
    border: 'rgba(212, 118, 78, 0.2)',
  },
  terminal: {
    name: 'Terminal',
    bg: '#000000',
    fg: '#00ff41',
    accent: '#00ff41',
    panel: '#0a0a0a',
    border: 'rgba(0, 255, 65, 0.2)',
  },
  claude: {
    name: 'Claude',
    bg: '#262624',
    fg: '#f5f4f0',
    accent: '#c6613f',
    panel: '#30302e',
    border: 'rgba(198, 97, 63, 0.2)',
  },
}

const LS_KEY = 'skyerackz-theme'
const DEFAULT_THEME = 'neonPink'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.name || DEFAULT_THEME
      }
    } catch {}
    return DEFAULT_THEME
  })

  const [customAccent, setCustomAccent] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.customAccent || null
      }
    } catch {}
    return null
  })

  const theme = THEMES[currentTheme] || THEMES[DEFAULT_THEME]
  const activeAccent = customAccent || theme.accent

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--bg-color', theme.bg)
    s.setProperty('--text-primary', theme.fg)
    s.setProperty('--text-accent', activeAccent)
    s.setProperty('--panel-bg', theme.panel)
    s.setProperty('--border-color', theme.border)

    // Persist
    localStorage.setItem(LS_KEY, JSON.stringify({
      name: currentTheme,
      customAccent: customAccent,
    }))
  }, [currentTheme, customAccent, theme, activeAccent])

  const switchTheme = (themeName) => {
    setCurrentTheme(themeName)
    setCustomAccent(null) // Reset custom accent on theme switch
  }

  const setAccent = (color) => {
    setCustomAccent(color)
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      theme,
      activeAccent,
      switchTheme,
      setAccent,
      themes: THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export default ThemeContext
