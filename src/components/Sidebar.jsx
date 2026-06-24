import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, User, Calendar, Image as ImageIcon, Settings } from 'lucide-react'

function Sidebar() {
  const navItems = [
    { name: 'Home', path: '/', icon: <Home size={24} /> },
    { name: 'About Me', path: '/about', icon: <User size={24} /> },
    { name: 'Bookings', path: '/bookings', icon: <Calendar size={24} /> },
    { name: 'Gallery', path: '/gallery', icon: <ImageIcon size={24} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={24} /> },
  ]

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">SR</div>
      <ul className="sidebar-nav">
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
      </ul>
    </nav>
  )
}

export default Sidebar
