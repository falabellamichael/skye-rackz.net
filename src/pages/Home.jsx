import React from 'react'
import useBgFit from '../hooks/useBgFit'

function Home() {
  const bgRef = useBgFit('/backgrounds/home-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="home-container"
      style={{ '--bg-image': 'url(/backgrounds/home-bg.jpg)' }}
    >
      <div className="content-wrapper">
        <div className="bio-section">
          <h2 className="bio-title">
            Public Enemy<br />
            <span className="bio-subtitle">#1</span>
          </h2>
          <p className="bio-text">
            I was born to defy expectation. I love fiercely and value the few
            who stayed by my side through the fire. I came from nowhere,
            traveling a path that led me to find my tribe scattered across the
            globe. I am a product of the 90s, fueled by the rebellion of
            classic rock and the raw storytelling of underground rap. Labeled a
            misfit and a problem child from day one, my journey was a
            battlefield shaped by trauma, struggle, and survival. I didn't just
            survive the trauma, the violence, and the dark moments that attempted
            to break me — I conquered them. I emerged from the pits to forge a
            sound dedicated to the misunderstood and the extraordinary. My music
            is a testament to the fact that you can come back from situations
            most people don't survive. I don't just perform; I provide a voice
            for the lost, the under-supported, and those who feel unseen. I am
            here for the misfits and the underestimated, proving that even when
            life is hard, we can make it legendary together. I am Skye Rackz.
            I've arrived, and I'm here to stay.
          </p>
          <p className="bio-signature">- Skye Rackz</p>
        </div>

        <div className="connect-section">
          <h1 className="header-accent">CONNECT WITH ME</h1>
          
          <div className="main-content">
            <div className="links-grid">
              <div className="links-column">
                <a href="#" className="social-link">PLAYBOY</a>
                <a href="#" className="social-link">INSTAGRAM</a>
                <a href="#" className="social-link">TIKTOK</a>
                <a href="#" className="social-link">SNAPCHAT</a>
              </div>
              <div className="links-column">
                <a href="#" className="social-link">BIGO</a>
                <a href="#" className="social-link">TWITCH</a>
                <a href="#" className="social-link">CLAPPER</a>
                <a href="#" className="social-link">YOUTUBE</a>
              </div>
              <div className="links-column">
                <a href="#" className="social-link">ONLYFANS</a>
                <a href="#" className="social-link">FACEBOOK</a>
                <a href="#" className="social-link">SPOTIFY</a>
              </div>
            </div>

            <div className="contact-column">
              <div className="contact-item row">
                <span className="contact-label">WHATSAPP</span>
                <a href="tel:6475263096" className="contact-value">647.526.3096</a>
              </div>
              <div className="contact-item">
                <a href="mailto:bookings@skyerackz.global" className="contact-value email">bookings@skyerackz.global</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-name">SKYE RACKZ</div>
      </div>
    </div>
  )
}

export default Home

