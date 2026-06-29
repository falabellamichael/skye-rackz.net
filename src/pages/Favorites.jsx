import React, { useState, useContext, useRef, useEffect } from 'react'
import { FavoritesContext } from '../context/FavoritesContext'
import { GlobalPlayerContext } from '../context/GlobalPlayerContext'
import { INITIAL_PHOTOS } from '../data/photos'
import { TRACKS } from '../data/tracks'
import { VIDEOS } from '../data/videos'
import { Heart, Play, Pause, Film, ChevronDown, ChevronRight } from 'lucide-react'
import useBgFit from '../hooks/useBgFit'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function Favorites() {
  const { 
    favoritePhotos, favoriteTracks, favoriteVideos,
    toggleFavoritePhoto, toggleFavoriteTrack, toggleFavoriteVideo,
    isFavoritePhoto, isFavoriteTrack, isFavoriteVideo
  } = useContext(FavoritesContext)

  // ── Derived Data ──
  const favPhotosData = INITIAL_PHOTOS.filter(photo => favoritePhotos.includes(photo.id))
  const favTracksData = TRACKS.filter(track => favoriteTracks.includes(track.id))
  const favVideosData = VIDEOS.filter(vid => favoriteVideos.includes(vid.id))

  const totalFavorites = favPhotosData.length + favTracksData.length + favVideosData.length

  const [expandedSections, setExpandedSections] = useState({
    photos: true,
    music: true,
    videos: true,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // ── Lightbox for Photos ──
  const [lightbox, setLightbox] = useState(null)

  const openLightbox = (index) => {
    if (favPhotosData[index].src) setLightbox(index)
  }
  const closeLightbox = () => setLightbox(null)

  const goNext = (e) => {
    e.stopPropagation()
    const next = (lightbox + 1) % favPhotosData.length
    if (favPhotosData[next].src) setLightbox(next)
  }

  const goPrev = (e) => {
    e.stopPropagation()
    const prev = (lightbox - 1 + favPhotosData.length) % favPhotosData.length
    if (favPhotosData[prev].src) setLightbox(prev)
  }

  useEffect(() => {
    const handler = (e) => {
      if (lightbox === null) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext(e)
      if (e.key === 'ArrowLeft') goPrev(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, favPhotosData])

  // ── Global Player Context ──
  const {
    currentMedia,
    mediaType,
    isPlaying,
    currentTime,
    duration,
    playMedia,
    pauseMedia,
    handleProgress
  } = useContext(GlobalPlayerContext)

  const favProgressRef = useRef(null)

  const favPlay = (track) => {
    playMedia(track, 'audio')
  }

  const handleFavProgress = (e) => {
    handleProgress(e, favProgressRef)
  }

  const isFavTrackPlaying = (track) => currentMedia?.id === track.id && mediaType === 'audio' && isPlaying
  const isVidPlaying = (vid) => currentMedia?.id === vid.id && mediaType === 'video' && isPlaying

  const favProgress = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Helpers ──
  const getTileClass = (photo) => {
    const classes = ['gallery-tile']
    if (!photo.src) classes.push('tile-placeholder')
    return classes.join(' ')
  }

  const bgRef = useBgFit('/backgrounds/favorites-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="page-container gallery-page"
      style={{ '--bg-image': 'url(/backgrounds/favorites-bg.jpg)' }}
    >
      <h1 className="page-header">FAVORITES</h1>
      <p className="gallery-subtitle">
        Your favorite photos, music, and videos.
      </p>

      {totalFavorites === 0 ? (
        <p className="page-placeholder">You haven't added any favorites yet. Explore the site to add some!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* ── PHOTOS SECTION ── */}
          {favPhotosData.length > 0 && (
            <div className="favorite-section">
              <button 
                className="gallery-favorites-heading accordion-header"
                onClick={() => toggleSection('photos')}
              >
                <span>Photos</span>
                {expandedSections.photos ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </button>
              {expandedSections.photos && (
                <div className="gallery-grid favorites-grid accordion-content">
                {favPhotosData.map((photo, i) => (
                  <div
                    key={photo.id}
                    className={getTileClass(photo)}
                    onClick={() => openLightbox(i)}
                    role={photo.src ? 'button' : undefined}
                    tabIndex={photo.src ? 0 : undefined}
                    onKeyDown={(e) => { if (e.key === 'Enter' && photo.src) openLightbox(i) }}
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
                        if (lightbox !== null) closeLightbox()
                      }}
                      aria-label="Toggle Favorite"
                    >
                      <Heart size={20} fill={isFavoritePhoto(photo.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}

          {/* ── MUSIC SECTION ── */}
          {favTracksData.length > 0 && (
            <div className="favorite-section">
              <button 
                className="gallery-favorites-heading accordion-header"
                onClick={() => toggleSection('music')}
              >
                <span>Music</span>
                {expandedSections.music ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </button>
              {expandedSections.music && (
                <div className="fav-mini-player accordion-content">
                  <div className="fav-mini-header">
                  <Heart size={14} fill="var(--text-accent)" />
                  <span>Favorited Songs</span>
                  <span className="fav-mini-count">{favTracksData.length}</span>
                </div>
                
                {currentMedia && mediaType === 'audio' && (
                  <div className="fav-mini-progress-row">
                    <span className="fav-mini-time">{formatTime(currentTime)}</span>
                    <div
                      className="fav-mini-progress"
                      ref={favProgressRef}
                      onClick={handleFavProgress}
                    >
                      <div className="fav-mini-progress-track">
                        <div
                          className="fav-mini-progress-fill"
                          style={{ width: `${favProgress}%` }}
                        />
                      </div>
                    </div>
                    <span className="fav-mini-time">{formatTime(duration)}</span>
                  </div>
                )}

                <div className="fav-mini-list">
                  {favTracksData.map((track) => (
                    <div
                      key={track.id}
                      className={`fav-mini-row ${currentMedia?.id === track.id && mediaType === 'audio' ? 'active' : ''}`}
                    >
                      <button
                        className="fav-mini-play-btn"
                        onClick={() => favPlay(track)}
                        title={isFavTrackPlaying(track) ? 'Pause' : 'Play'}
                      >
                        {isFavTrackPlaying(track) ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                      <div className="fav-mini-info">
                        <span className="fav-mini-title">{track.title}</span>
                        <span className="fav-mini-artist">{track.artist}</span>
                      </div>
                      <button
                        className="fav-mini-unlike"
                        onClick={(e) => { e.stopPropagation(); toggleFavoriteTrack(track.id); }}
                        title="Unlike"
                      >
                        <Heart size={13} fill="currentColor" />
                      </button>
                      <span className="fav-mini-duration">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}

          {/* ── VIDEOS SECTION ── */}
          {favVideosData.length > 0 && (
            <div className="favorite-section">
              <button 
                className="gallery-favorites-heading accordion-header"
                onClick={() => toggleSection('videos')}
              >
                <span>Videos</span>
                {expandedSections.videos ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
              </button>
              {expandedSections.videos && (
                <div className="fav-mini-player accordion-content">
                <div className="fav-mini-header">
                  <Heart size={14} fill="var(--text-accent)" />
                  <span>Favorited Videos</span>
                  <span className="fav-mini-count">{favVideosData.length}</span>
                </div>
                
                {currentMedia && mediaType === 'video' && (
                  <div className="player-preview" style={{ height: 'clamp(200px, 30vw, 300px)' }}>
                    <div className="player-visualizer">
                      <Film size={48} opacity={0.3} style={{ marginBottom: '1rem' }} />
                      <div className="now-playing-info" style={{ textAlign: 'center' }}>
                        <span className="np-title" style={{ fontSize: '1rem' }}>{currentMedia.title}</span>
                        <span className="np-artist" style={{ opacity: 0.5, marginTop: '0.2rem' }}>Video Preview</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="fav-mini-list">
                  {favVideosData.map((vid) => (
                    <div
                      key={vid.id}
                      className={`fav-mini-row ${currentMedia?.id === vid.id && mediaType === 'video' ? 'active' : ''}`}
                    >
                      <button
                        className="fav-mini-play-btn"
                        onClick={() => playMedia(vid, 'video')}
                        title={isVidPlaying(vid) ? 'Pause' : 'Play'}
                      >
                        {isVidPlaying(vid) ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                      <div className="fav-mini-info">
                        <span className="fav-mini-title">{vid.title}</span>
                      </div>
                      <button
                        className="fav-mini-unlike"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleFavoriteVideo(vid.id);
                          if (currentMedia?.id === vid.id && mediaType === 'video') pauseMedia();
                        }}
                        title="Unlike"
                      >
                        <Heart size={13} fill="currentColor" />
                      </button>
                      <span className="fav-mini-duration">{vid.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox for photos */}
      {lightbox !== null && favPhotosData[lightbox]?.src && (
        <div className="lightbox-backdrop" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
            &times;
          </button>
          <button className="lightbox-arrow lightbox-prev" onClick={goPrev} aria-label="Previous">
            &lsaquo;
          </button>
          <img
            src={favPhotosData[lightbox].src}
            alt={favPhotosData[lightbox].alt}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-arrow lightbox-next" onClick={goNext} aria-label="Next">
            &rsaquo;
          </button>
          <p className="lightbox-caption">{favPhotosData[lightbox].alt}</p>
        </div>
      )}
    </div>
  )
}

export default Favorites
