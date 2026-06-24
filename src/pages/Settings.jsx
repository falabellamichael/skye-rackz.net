import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { Palette, Check } from 'lucide-react'

function Settings() {
  const { currentTheme, activeAccent, switchTheme, setAccent, themes } = useTheme()

  const quickAccents = [
    '#FF007F', '#e040fb', '#f85149', '#4facfe', '#00ff41',
    '#e94560', '#9b6dcc', '#d4764e', '#ffcc00', '#ff6b6b',
  ]

  return (
    <div className="page-container settings-page">
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
              <div className="swatch-colors">
                <span style={{ backgroundColor: t.bg }}></span>
                <span style={{ backgroundColor: t.panel }}></span>
                <span style={{ backgroundColor: t.fg }}></span>
                <span style={{ backgroundColor: t.accent }}></span>
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
    </div>
  )
}

export default Settings
