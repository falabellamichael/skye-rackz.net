import React from 'react'

const services = [
  {
    id: 'hosting',
    title: 'Hosting',
    description: 'Book a Skye Rackz to host your event',
    duration: '1 hr',
    price: 'CA$500',
    buttonText: 'Request to Book',
    bookNow: false,
  },
  {
    id: 'photoshoot',
    title: 'Photo/Videoshoot Session',
    description: 'Personalized Modeling Photoshoot',
    duration: '1 hr',
    price: 'CA$500',
    buttonText: 'Request to Book',
    bookNow: false,
  },
  {
    id: 'feature',
    title: 'Feature or Verse',
    description: 'Feature on a song with Skye Rackz',
    duration: '1 hr',
    price: 'CA$500',
    buttonText: 'BOOK NOW',
    bookNow: true,
  },
  {
    id: 'custom',
    title: 'CUSTOMIZABLE PACKAGES',
    description: 'Give me and my team a call to customize your experience',
    duration: '12 hr',
    price: 'PTBD',
    buttonText: 'Request to Book',
    bookNow: false,
  },
]

function Bookings() {
  return (
    <div className="page-container bookings-page">
      <h1 className="page-header">BOOKINGS</h1>
      <p className="bookings-subtitle">Select a service to get started</p>

      <div className="services-list">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-thumb">
              <div className="service-thumb-placeholder" />
            </div>

            <div className="service-info">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.description}</p>
            </div>

            <div className="service-meta">
              <span className="service-duration">{service.duration}</span>
              <span className="service-price">{service.price}</span>
            </div>

            <button
              className={`service-btn${service.bookNow ? ' book-now' : ''}`}
              onClick={() => window.open('mailto:bookings@skyerackz.global?subject=Booking: ' + service.title, '_blank')}
            >
              {service.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Bookings
