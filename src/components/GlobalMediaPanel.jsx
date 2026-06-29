import React, { useContext, useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GlobalPlayerContext } from '../context/GlobalPlayerContext'
import { useTheme } from '../context/ThemeContext'
import { Play, Pause, X, Music, Film, SkipForward, SkipBack, Maximize2, Minus } from 'lucide-react'
import { TRACKS } from '../data/tracks'
import { VIDEOS } from '../data/videos'
import { INITIAL_PHOTOS } from '../data/photos'
import GlobalMiniPlayer from './GlobalMiniPlayer'

export default function GlobalMediaPanel() {
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
  
  const { sidebarPosition } = useTheme()
  const isRightSidebar = sidebarPosition === 'right'
  
  const location = useLocation()
  const navigate = useNavigate()

  const [width, setWidth] = useState(320)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900)
  const [listMode, setListMode] = useState('audio')
  const [trackListHeight, setTrackListHeight] = useState(null)
  const [isVerticalResizing, setIsVerticalResizing] = useState(false)
  const [randomPhoto, setRandomPhoto] = useState(null)
  const verticalResizeRef = useRef({ startY: 0, startHeight: 0 })
  
  useEffect(() => {
    if (mediaType) setListMode(mediaType)
  }, [mediaType])

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * INITIAL_PHOTOS.length)
    setRandomPhoto(INITIAL_PHOTOS[randomIndex])
  }, [])

  const isMusicPage = location.pathname === '/playlist'
  const isVideoPage = location.pathname === '/videos'
  const isEditorPage = location.pathname === '/vibes'
  const shouldHide = isEditorPage || (mediaType === 'audio' && isMusicPage) || (mediaType === 'video' && isVideoPage)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (shouldHide || isMobile || isCollapsed) {
      document.body.style.setProperty('--media-panel-width', '0px')
    } else {
      document.body.style.setProperty('--media-panel-width', `${width}px`)
    }
    
    return () => {
      document.body.style.setProperty('--media-panel-width', '0px')
    }
  }, [width, isCollapsed, isMobile, shouldHide])

  // Drag logic
  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    if (!isResizing) return
    
    const handleMouseMove = (e) => {
      let newWidth = isRightSidebar ? e.clientX : window.innerWidth - e.clientX
      
      if (newWidth < 150) {
         setIsCollapsed(true)
         setIsResizing(false)
      } else {
         setWidth(Math.min(Math.max(newWidth, 250), 600))
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isRightSidebar])

  // Vertical track-list resize logic
  const handleVerticalMouseDown = (e) => {
    const listEl = document.querySelector('.media-panel-list')
    const currentHeight = listEl ? listEl.getBoundingClientRect().height : 200
    verticalResizeRef.current = { startY: e.clientY, startHeight: currentHeight }
    setIsVerticalResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    if (!isVerticalResizing) return
    const handleMouseMove = (e) => {
      const delta = verticalResizeRef.current.startY - e.clientY
      const maxListHeight = Math.max(100, window.innerHeight - 300)
      const newHeight = Math.min(Math.max(verticalResizeRef.current.startHeight + delta, 80), maxListHeight)
      setTrackListHeight(newHeight)
    }
    const handleMouseUp = () => setIsVerticalResizing(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isVerticalResizing])

  if (isMobile || shouldHide) {
     return <GlobalMiniPlayer />
  }

  if (isCollapsed) {
     return <GlobalMiniPlayer forceShow={true} onExpand={() => setIsCollapsed(false)} />
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleToggle = () => {
    if (isPlaying) pauseMedia()
    else if (currentMedia) playMedia(currentMedia, mediaType)
  }

  const handleNavigate = () => {
    if (currentMedia && isPlaying) {
      if (mediaType === 'audio') navigate('/playlist')
      else if (mediaType === 'video') navigate('/videos')
    } else if (randomPhoto) {
      navigate('/gallery', { state: { openPhotoId: randomPhoto.id } })
    }
  }

  return (
    <div className={`global-media-panel ${isRightSidebar ? 'panel-left' : 'panel-right'}`} style={{ width: `${width}px` }}>
      <div className="media-panel-resizer" onMouseDown={handleMouseDown} />
      
      <div className="media-panel-header">
        <h2>{mediaType === 'audio' ? 'Now Playing' : 'Now Watching'}</h2>
        <div className="media-panel-actions">
          <button className="icon-btn" onClick={() => setIsCollapsed(true)} title="Minimize to Pill"><Minus size={18} /></button>
          <button className="icon-btn" onClick={closeMedia} title="Close"><X size={18} /></button>
        </div>
      </div>
      
      <div className="media-panel-art-wrapper">
        <div className="media-panel-art" onClick={handleNavigate}>
          {(currentMedia && isPlaying) ? (
            (currentMedia.cover || currentMedia.thumb) ? (
              <img src={currentMedia.cover || currentMedia.thumb} alt="Cover" />
            ) : (
              <div className="media-panel-placeholder">
                {mediaType === 'audio' ? <Music size={48} opacity={0.5} /> : <Film size={48} opacity={0.5} />}
              </div>
            )
          ) : randomPhoto ? (
            <img src={randomPhoto.src} alt="Skye" />
          ) : (
            <div className="media-panel-placeholder">
              {mediaType === 'audio' ? <Music size={48} opacity={0.5} /> : <Film size={48} opacity={0.5} />}
            </div>
          )}
        </div>
      </div>
      
      <div className="media-panel-info">
        <h3 className="media-panel-title">{currentMedia?.title || 'Nothing Playing'}</h3>
        {mediaType === 'audio' && <p className="media-panel-artist">{currentMedia?.artist}</p>}
      </div>
      
      <div className="media-panel-playback">
        <div className="media-panel-progress" onClick={handleProgress}>
          <div className="media-panel-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="media-panel-controls">
           <button className="icon-btn"><SkipBack size={24} fill="currentColor" /></button>
           <button className="icon-btn play-btn" onClick={handleToggle}>
             {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
           </button>
           <button className="icon-btn"><SkipForward size={24} fill="currentColor" /></button>
        </div>
      </div>
      
      <div
        className={`media-panel-vertical-resizer ${isVerticalResizing ? 'active' : ''}`}
        onMouseDown={handleVerticalMouseDown}
      />
      
      <div className="media-panel-tabs">
        <button 
          className={`media-panel-tab ${listMode === 'audio' ? 'active' : ''}`}
          onClick={() => setListMode('audio')}
        >
          <Music size={16} /> Music
        </button>
        <button 
          className={`media-panel-tab ${listMode === 'video' ? 'active' : ''}`}
          onClick={() => setListMode('video')}
        >
          <Film size={16} /> Video
        </button>
      </div>
      
      <div className="media-panel-list" style={trackListHeight ? { height: trackListHeight, flex: 'none' } : {}}>
        {listMode === 'audio' ? (
          TRACKS.map(track => (
            <div 
              key={track.id} 
              className={`media-panel-list-item ${currentMedia?.id === track.id && mediaType === 'audio' ? 'active' : ''}`}
              onClick={() => playMedia(track, 'audio')}
            >
              {currentMedia?.id === track.id && mediaType === 'audio' && isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <div className="media-panel-list-info">
                <span className="media-panel-list-title">{track.title}</span>
                <span className="media-panel-list-sub">{track.artist}</span>
              </div>
            </div>
          ))
        ) : (
          VIDEOS.map(vid => (
            <div 
              key={vid.id} 
              className={`media-panel-list-item ${currentMedia?.id === vid.id && mediaType === 'video' ? 'active' : ''}`}
              onClick={() => playMedia(vid, 'video')}
            >
              {currentMedia?.id === vid.id && mediaType === 'video' && isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <div className="media-panel-list-info">
                <span className="media-panel-list-title">{vid.title}</span>
                <span className="media-panel-list-sub">{vid.duration}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
