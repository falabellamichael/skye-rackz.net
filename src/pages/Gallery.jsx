import React, { useState, useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { FavoritesContext } from '../context/FavoritesContext'
import { INITIAL_PHOTOS } from '../data/photos'
import { Heart, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import useBgFit from '../hooks/useBgFit'

const Pagination = ({ currentPage, totalPages, setPage }) => {
  const [inputValue, setInputValue] = useState(currentPage + 1)

  useEffect(() => {
    setInputValue(currentPage + 1)
  }, [currentPage])

  const handleGo = () => {
    const val = parseInt(inputValue, 10)
    if (!isNaN(val) && val >= 1 && val <= totalPages) {
      setPage(val - 1)
    } else {
      setInputValue(currentPage + 1)
    }
  }

  if (totalPages <= 1) return null

  return (
    <div className="pagination-wrapper">
      <div className="pagination-goto">
        <span>Go to page:</span>
        <input 
          type="number" 
          min={1} 
          max={totalPages} 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGo() }}
          onBlur={handleGo}
        />
      </div>
      <div className="pagination-controls">
        <button 
          className="pagination-btn" 
          disabled={currentPage === 0} 
          onClick={() => setPage(p => p - 1)}
        >
          <ChevronLeft size={18} /> Prev
        </button>
        <span className="pagination-info">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button 
          className="pagination-btn" 
          disabled={currentPage === totalPages - 1} 
          onClick={() => setPage(p => p + 1)}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

function Gallery() {
  const location = useLocation()
  const [photos] = useState(INITIAL_PHOTOS)
  const { toggleFavoritePhoto, isFavoritePhoto, favoritePhotos: favoritePhotoIds } = useContext(FavoritesContext)
  const [lightbox, setLightbox] = useState(null)
  const bgRef = useBgFit('/backgrounds/gallery-bg.jpg')

  const ITEMS_PER_PAGE = 12
  const [pageFavorites, setPageFavorites] = useState(0)
  const [pageAll, setPageAll] = useState(0)

  useEffect(() => {
    if (location.state?.openPhotoId) {
      const index = photos.findIndex(p => p.id === location.state.openPhotoId)
      if (index !== -1) {
        setLightbox(index)
        const page = Math.floor(index / ITEMS_PER_PAGE)
        setPageAll(page)
      }
      window.history.replaceState({}, '')
    }
  }, [location.state, photos])

  const favoritePhotos = photos.filter(p => (favoritePhotoIds || []).includes(p.id))

  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    all: true
  })
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }



  const favTotalPages = Math.ceil(favoritePhotos.length / ITEMS_PER_PAGE)
  const currentFavs = favoritePhotos.slice(pageFavorites * ITEMS_PER_PAGE, (pageFavorites + 1) * ITEMS_PER_PAGE)

  const allTotalPages = Math.ceil(photos.length / ITEMS_PER_PAGE)
  const currentAll = photos.slice(pageAll * ITEMS_PER_PAGE, (pageAll + 1) * ITEMS_PER_PAGE)

  const openLightbox = (index) => {
    if (photos[index].src) {
      setLightbox(index)
    }
  }

  const closeLightbox = () => setLightbox(null)

  const goNext = (e) => {
    e.stopPropagation()
    const next = (lightbox + 1) % photos.length
    if (photos[next].src) setLightbox(next)
  }

  const goPrev = (e) => {
    e.stopPropagation()
    const prev = (lightbox - 1 + photos.length) % photos.length
    if (photos[prev].src) setLightbox(prev)
  }

  React.useEffect(() => {
    const handler = (e) => {
      if (lightbox === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext(e)
      if (e.key === 'ArrowLeft') goPrev(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox])

  useEffect(() => {
    if (lightbox === null) {
      document.body.classList.remove('gallery-lightbox-open')
      return
    }

    document.body.classList.add('gallery-lightbox-open')
    return () => {
      document.body.classList.remove('gallery-lightbox-open')
    }
  }, [lightbox])

  const getTileClass = (photo) => {
    const classes = ['gallery-tile']
    if (photo.wide && photo.tall) classes.push('tile-wide', 'tile-tall')
    else if (photo.wide) classes.push('tile-wide')
    else if (photo.tall) classes.push('tile-tall')
    if (!photo.src) classes.push('tile-placeholder')
    return classes.join(' ')
  }

  return (
    <div
      ref={bgRef}
      className="page-container gallery-page"
      style={{ '--bg-image': 'url(/backgrounds/gallery-bg.jpg)' }}
    >
      <h1 className="page-header">GALLERY</h1>
      <p className="gallery-subtitle">
        Click any photo to view full size.
      </p>

      {/* ── Favorites Section ── */}
      {favoritePhotos.length > 0 && (
        <div className="gallery-favorites-section favorite-section">
          <button 
            className="gallery-favorites-heading accordion-header"
            onClick={() => toggleSection('favorites')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Heart size={18} fill="var(--text-accent)" /> FAVORITES</span>
            {expandedSections.favorites ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </button>
          
          {expandedSections.favorites && (
            <div className="accordion-content">
              <div className="gallery-grid favorites-grid">
                {currentFavs.map((photo) => (
              <div
                key={photo.id}
                className={getTileClass(photo)}
                onClick={() => openLightbox(photos.findIndex(p => p.id === photo.id))}
                role={photo.src ? 'button' : undefined}
                tabIndex={photo.src ? 0 : undefined}
                onKeyDown={(e) => { if (e.key === 'Enter' && photo.src) openLightbox(photos.findIndex(p => p.id === photo.id)) }}
              >
                {photo.src ? (
                  <img src={photo.src} alt={photo.alt} className="gallery-img" loading="lazy" />
                ) : (
                  <div className="gallery-placeholder-inner">
                    <div className="placeholder-diamond" />
                    <span className="placeholder-text">{photo.alt}</span>
                  </div>
                )}
                <div className="tile-overlay">
                  <span className="tile-overlay-text">{photo.alt}</span>
                </div>
                <button 
                  className={`favorite-btn ${isFavoritePhoto(photo.id) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavoritePhoto(photo.id)
                  }}
                  aria-label="Toggle Favorite"
                >
                  <Heart size={20} fill={isFavoritePhoto(photo.id) ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
              </div>
              <Pagination currentPage={pageFavorites} totalPages={favTotalPages} setPage={setPageFavorites} />
            </div>
          )}
        </div>
      )}

      <div className="gallery-all-section favorite-section" style={{ marginTop: favoritePhotos.length > 0 ? '2rem' : '0' }}>
        <button 
          className="gallery-favorites-heading accordion-header"
          onClick={() => toggleSection('all')}
        >
          <span>ALL PHOTOS</span>
          {expandedSections.all ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </button>

        {expandedSections.all && (
          <div className="accordion-content">
            <div className="gallery-grid">
              {currentAll.map((photo) => (
                <div
                  key={photo.id}
                  className={getTileClass(photo)}
                  onClick={() => openLightbox(photos.findIndex(p => p.id === photo.id))}
                  role={photo.src ? 'button' : undefined}
                  tabIndex={photo.src ? 0 : undefined}
                  onKeyDown={(e) => { if (e.key === 'Enter' && photo.src) openLightbox(photos.findIndex(p => p.id === photo.id)) }}
                >
            {photo.src ? (
              <img src={photo.src} alt={photo.alt} className="gallery-img" loading="lazy" />
            ) : (
              <div className="gallery-placeholder-inner">
                <div className="placeholder-diamond" />
                <span className="placeholder-text">{photo.alt}</span>
              </div>
            )}
            <div className="tile-overlay">
              <span className="tile-overlay-text">{photo.alt}</span>
            </div>
            
            <button 
              className={`favorite-btn ${isFavoritePhoto(photo.id) ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleFavoritePhoto(photo.id)
              }}
              aria-label="Toggle Favorite"
            >
              <Heart size={20} fill={isFavoritePhoto(photo.id) ? "currentColor" : "none"} />
            </button>
          </div>
        ))}
            </div>
            <Pagination currentPage={pageAll} totalPages={allTotalPages} setPage={setPageAll} />
          </div>
        )}
      </div>

      {lightbox !== null && photos[lightbox].src && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
            &times;
          </button>
          <button className="lightbox-arrow lightbox-prev" onClick={goPrev} aria-label="Previous">
            &lsaquo;
          </button>
          <img
            src={photos[lightbox].src}
            alt={photos[lightbox].alt}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-arrow lightbox-next" onClick={goNext} aria-label="Next">
            &rsaquo;
          </button>
          <p className="lightbox-caption">{photos[lightbox].alt}</p>
        </div>
      )}
    </div>
  )
}

export default Gallery
