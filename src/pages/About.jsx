import React from 'react'
import useBgFit from '../hooks/useBgFit'

function About() {
  const bgRef = useBgFit('/backgrounds/about-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="page-container"
      style={{ '--bg-image': 'url(/backgrounds/about-bg.jpg)' }}
    >
      <h1 className="page-header">ABOUT ME</h1>
      <p className="page-placeholder">Content coming soon...</p>
    </div>
  )
}

export default About
