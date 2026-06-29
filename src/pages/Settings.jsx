import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { Palette, Check, PanelLeft, PanelRight } from 'lucide-react'
import useBgFit from '../hooks/useBgFit'

function Settings() {
  const { currentTheme, activeAccent, switchTheme, setAccent, themes, sidebarPosition, setSidebarPosition } = useTheme()

  const quickAccents = [
    '#FF007F', '#e040fb', '#f85149', '#4facfe', '#00ff41',
    '#e94560', '#9b6dcc', '#d4764e', '#ffcc00', '#ff6b6b',
  ]

  const bgRef = useBgFit('/backgrounds/settings-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="page-container settings-page"
      style={{ '--bg-image': 'url(/backgrounds/settings-bg.jpg)' }}
    >
      <h1 className="page-header">SETTINGS</h1>

      {/* Theme Presets */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          <Palette size={20} />
          Theme Presets
        </h2>
        <p className="settings-section-desc">Choose a color scheme for your site. Inspired by Odysseus.</p>

        <div className="theme-grid">
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              className={`theme-swatch-btn${currentTheme === key ? ' active' : ''}`}
              onClick={() => switchTheme(key)}
            >
              <div
                className="swatch-preview"
                style={{ backgroundColor: t.bg, borderColor: t.border }}
              >
                <div className="swatch-preview-bar" style={{ backgroundColor: t.panel }}>
                  <span style={{ color: t.fg }}>Aa</span>
                  <span className="swatch-preview-accent" style={{ backgroundColor: t.accent }} />
                </div>
                <div className="swatch-preview-body" style={{ color: t.fg }}>
                  <span className="swatch-preview-line" style={{ backgroundColor: t.fg, opacity: 0.7 }} />
                  <span className="swatch-preview-line short" style={{ backgroundColor: t.fg, opacity: 0.4 }} />
                  <span className="swatch-preview-dot" style={{ backgroundColor: t.accent }} />
                </div>
              </div>
              <span className="swatch-label">{t.name}</span>
              {currentTheme === key && (
                <span className="swatch-check"><Check size={14} /></span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Custom Accent Color */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          <Palette size={20} />
          Accent Color
        </h2>
        <p className="settings-section-desc">Override the accent color with a custom pick.</p>

        <div className="accent-picker-row">
          {quickAccents.map((color) => (
            <button
              key={color}
              className={`accent-dot${activeAccent === color ? ' active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setAccent(color)}
              title={color}
            />
          ))}
          <label className="accent-custom-label">
            <input
              type="color"
              value={activeAccent}
              onChange={(e) => setAccent(e.target.value)}
              className="accent-custom-input"
            />
            Custom
          </label>
        </div>
      </section>

      {/* Sidebar Position */}
      <section className="settings-section">
        <h2 className="settings-section-title">
          <PanelLeft size={20} />
          Sidebar Position
        </h2>
        <p className="settings-section-desc">Choose whether the navigation menu appears on the left or right side.</p>

        <div className="sidebar-position-options" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button 
            className={`theme-swatch-btn ${sidebarPosition === 'left' ? 'active' : ''}`}
            onClick={() => setSidebarPosition('left')}
            style={{ padding: '1rem 2rem', fontSize: '1rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <PanelLeft size={18} /> Left
          </button>
          <button 
            className={`theme-swatch-btn ${sidebarPosition === 'right' ? 'active' : ''}`}
            onClick={() => setSidebarPosition('right')}
            style={{ padding: '1rem 2rem', fontSize: '1rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <PanelRight size={18} /> Right
          </button>
        </div>
      </section>
    </div>
  )
}

export default Settings
