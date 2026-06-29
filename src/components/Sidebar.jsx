import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { Home, User, Calendar, Camera, Settings, Sparkles, Heart, Star, Music, Coffee, ChevronLeft, ChevronRight, ChevronDown, Video, Folder } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function Sidebar({ collapsed, onToggle }) {
  const { sidebarPosition } = useTheme()
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const toggleRef = useRef(null)
  const [popoverStyle, setPopoverStyle] = useState({})

  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={22} /> },
  ]

  // Portfolio sub-items
  const portfolioItems = [
    { name: 'Gallery', path: '/gallery', icon: <Camera size={18} /> },
    { name: 'Music', path: '/playlist', icon: <Music size={18} /> },
    { name: 'Videos', path: '/videos', icon: <Video size={18} /> },
  ]

  const mainItems = [
    { name: 'About Me', path: '/about', icon: <User size={22} /> },
    { name: 'Bookings', path: '/bookings', icon: <Calendar size={22} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={22} /> },
  ]

  const extraItems = [
    { name: 'Favorites', path: '/favorites', icon: <Heart size={22} /> },
    { name: 'Featured', path: '/featured', icon: <Star size={22} /> },
    { name: 'Vibes', path: '/vibes', icon: <Sparkles size={22} /> },
    { name: 'Fuel', path: '/fuel', icon: <Coffee size={22} /> },
  ]

  const togglePortfolio = () => setPortfolioOpen(!portfolioOpen)

  // Recalculate popover position on open / resize
  const updatePopover = useCallback(() => {
    if (!toggleRef.current) return
    const rect = toggleRef.current.getBoundingClientRect()
    
    if (sidebarPosition === 'right') {
      setPopoverStyle({
        position: 'fixed',
        right: document.documentElement.clientWidth - rect.left,
        top: rect.top,
        zIndex: 9999,
      })
    } else {
      setPopoverStyle({
        position: 'fixed',
        left: Math.min(rect.right, document.documentElement.clientWidth - 160),
        top: rect.top,
        zIndex: 9999,
      })
    }
  }, [sidebarPosition])

  useEffect(() => {
    if (!portfolioOpen) return
    updatePopover()
    window.addEventListener('resize', updatePopover)
    window.addEventListener('scroll', updatePopover, { passive: true })
    return () => {
      window.removeEventListener('resize', updatePopover)
      window.removeEventListener('scroll', updatePopover)
    }
  }, [portfolioOpen, updatePopover])

  // Close on outside click
  useEffect(() => {
    if (!portfolioOpen) return
    const handleClick = (e) => {
      if (toggleRef.current && !toggleRef.current.contains(e.target)) {
        const popover = document.getElementById('portfolio-popover')
        if (popover && !popover.contains(e.target)) {
          setPortfolioOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [portfolioOpen])

  const submenu = (
    <ul
      id="portfolio-popover"
      className={`nav-submenu popover ${portfolioOpen ? 'open' : ''}`}
      style={popoverStyle}
    >
      {portfolioItems.map((item) => (
        <li key={item.name}>
          <NavLink
            to={item.path}
            className={({ isActive }) => isActive ? "nav-sublink active" : "nav-sublink"}
            onClick={() => setPortfolioOpen(false)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">SR</div>
      <ul className="sidebar-nav">
        {/* Home */}
        {navItems.map((item) => (
          <li key={item.name}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          </li>
        ))}

        {/* Portfolio Dropdown */}
        <li className="nav-dropdown">
          <button
            ref={toggleRef}
            className={`nav-link nav-dropdown-toggle ${portfolioOpen ? 'open' : ''}`}
            onClick={togglePortfolio}
            aria-expanded={portfolioOpen}
          >
            <span className="nav-icon"><Folder size={22} /></span>
            <span className="nav-text">Portfolio</span>
            <ChevronDown size={14} className={`dropdown-chevron ${portfolioOpen ? 'open' : ''}`} />
          </button>
          {/* Wide screen: inline submenu */}
          <ul className={`nav-submenu inline ${portfolioOpen ? 'open' : ''}`}>
            {portfolioItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => isActive ? "nav-sublink active" : "nav-sublink"}
                  onClick={() => setPortfolioOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </li>

        {/* Main items */}
        {mainItems.map((item) => (
          <li key={item.name}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <button className="sidebar-divider-toggle" onClick={onToggle} title="Hide sidebar">
        <span className="sidebar-divider-line" />
        {sidebarPosition === 'right' ? (
          <ChevronRight size={14} className="divider-chevron" />
        ) : (
          <ChevronLeft size={14} className="divider-chevron" />
        )}
        <span className="sidebar-divider-line" />
      </button>
      <ul className="sidebar-nav">
        {extraItems.map((item) => (
          <li key={item.name}>
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <span>© 2026 Skye Rackz</span>
      </div>

      {/* Narrow screen: portal popover outside sidebar so it isn't clipped */}
      {createPortal(submenu, document.body)}
    </nav>
  )
}

export default Sidebar
