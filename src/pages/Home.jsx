import React from 'react'

function Home() {
  return (
    <div className="home-container">
      {/* Background Section (Lace placeholder) */}
      <div className="hero-bg"></div>

      <div className="content-wrapper">
        <h1 className="header-accent">CONNECT WITH ME</h1>
        
        <div className="main-content">
          <div className="links-column">
            <a href="#" className="social-link">ONLYFANS</a>
            <a href="#" className="social-link">FACEBOOK</a>
            <a href="#" className="social-link">SPOTIFY</a>
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
        
        <div className="footer-name">SKYE RACKZ</div>
      </div>
    </div>
  )
}

export default Home
