import React, { useContext, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GlobalPlayerContext } from '../context/GlobalPlayerContext'
import { Play, Pause, X, Music, Film, ChevronUp, ChevronDown, Minus, Headphones } from 'lucide-react'
import { TRACKS } from '../data/tracks'
import { VIDEOS } from '../data/videos'

function GlobalMiniPlayer({ forceShow = false, onExpand = null }) {
  const { 
    currentMedia, 
    mediaType, 
    isPlaying, 
    currentTime, 
    duration, 
    playMedia,
    pauseMedia,
    closeMedia,
    handleProgress
  } = useContext(GlobalPlayerContext)
  
  const location = useLocation()
  const navigate = useNavigate()

  const [isExpanded, setIsExpanded] = useState(false)
  const [listMode, setListMode] = useState('audio')
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    if (mediaType) setListMode(mediaType)
  }, [mediaType])

  const isMusicPage = location.pathname === '/playlist'
  const isVideoPage = location.pathname === '/videos'
  const shouldHide = !forceShow && (!currentMedia || (mediaType === 'audio' && isMusicPage) || (mediaType === 'video' && isVideoPage))

  useEffect(() => {
    if (shouldHide) {
      document.body.classList.remove('has-mini-player', 'has-mini-player-minimized')
    } else if (isMinimized) {
      document.body.classList.remove('has-mini-player')
      document.body.classList.add('has-mini-player-minimized')
    } else {
      document.body.classList.remove('has-mini-player-minimized')
      document.body.classList.add('has-mini-player')
    }
    return () => {
      document.body.classList.remove('has-mini-player', 'has-mini-player-minimized')
    }
  }, [shouldHide, isMinimized])

  // Also hide if on favorites and the media started there? We don't track source page right now, 
  // but generally hiding it on the main page is enough.
  
  if (shouldHide) return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleToggle = () => {
    if (isPlaying) pauseMedia()
    else playMedia(currentMedia, mediaType)
  }

  const handleClose = (e) => {
    e.stopPropagation()
    closeMedia()
  }

  const handleNavigate = () => {
    if (mediaType === 'audio') navigate('/playlist')
    else if (mediaType === 'video') navigate('/videos')
  }

  if (isMinimized || (forceShow && onExpand)) {
    return (
      <div className="global-mini-minimized" onClick={() => {
        if (onExpand) onExpand()
        else setIsMinimized(false)
      }}>
        {mediaType === 'audio' ? <Headphones size={16} /> : <Film size={16} />}
        <span>{mediaType === 'audio' ? 'Music' : 'Video'}</span>
      </div>
    )
  }

  return (
    <div className={`global-mini-player ${isExpanded ? 'expanded' : ''}`} onClick={handleNavigate}>
      <div className="global-mini-progress">
        <div 
          className="global-mini-progress-fill" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      
      <div className="global-mini-preview">
        {mediaType === 'audio' && currentMedia.cover ? (
          <img src={currentMedia.cover} alt="Cover" />
        ) : (
          <div className="global-mini-placeholder">
            {mediaType === 'audio' ? <Music size={24} opacity={0.5} /> : <Film size={24} opacity={0.5} />}
          </div>
        )}
        <button 
          className="global-mini-minimize-btn"
          onClick={(e) => { e.stopPropagation(); setIsMinimized(true) }}
          title="Minimize"
        >
          <Minus size={16} />
        </button>
      </div>
      
      <div className="global-mini-content">
        <div className="global-mini-info">
          <span className="global-mini-title">{currentMedia.title}</span>
          {mediaType === 'audio' && <span className="global-mini-artist">{currentMedia.artist}</span>}
        </div>
        
        <div className="global-mini-controls">
          <button 
            className="global-mini-btn" 
            onClick={(e) => { e.stopPropagation(); handleToggle() }}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button 
            className="global-mini-btn" 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
            title="Toggle List"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
          <button 
            className="global-mini-btn" 
            onClick={handleClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="global-mini-expanded" onClick={(e) => e.stopPropagation()}>
          <div className="global-mini-tabs">
            <button 
              className={`global-mini-tab ${listMode === 'audio' ? 'active' : ''}`}
              onClick={() => setListMode('audio')}
            >
              <Music size={14} /> Music
            </button>
            <button 
              className={`global-mini-tab ${listMode === 'video' ? 'active' : ''}`}
              onClick={() => setListMode('video')}
            >
              <Film size={14} /> Video
            </button>
          </div>
          
          <div className="global-mini-list">
            {listMode === 'audio' ? (
              TRACKS.map(track => (
                <div 
                  key={track.id} 
                  className={`global-mini-list-item ${currentMedia?.id === track.id && mediaType === 'audio' ? 'active' : ''}`}
                  onClick={() => playMedia(track, 'audio')}
                >
                  {currentMedia?.id === track.id && mediaType === 'audio' && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <div className="global-mini-list-info">
                    <span className="global-mini-list-title">{track.title}</span>
                    <span className="global-mini-list-sub">{track.artist}</span>
                  </div>
                </div>
              ))
            ) : (
              VIDEOS.map(vid => (
                <div 
                  key={vid.id} 
                  className={`global-mini-list-item ${currentMedia?.id === vid.id && mediaType === 'video' ? 'active' : ''}`}
                  onClick={() => playMedia(vid, 'video')}
                >
                  {currentMedia?.id === vid.id && mediaType === 'video' && isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <div className="global-mini-list-info">
                    <span className="global-mini-list-title">{vid.title}</span>
                    <span className="global-mini-list-sub">{vid.duration}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalMiniPlayer
