import React, { useState, useContext, useRef, useCallback, useEffect } from 'react'
import {
  Play, Pause, Film, Heart, Maximize2, X,
  SkipBack, SkipForward, Volume2, VolumeX,
  Minimize2
} from 'lucide-react'
import { FavoritesContext } from '../context/FavoritesContext'
import { GlobalPlayerContext } from '../context/GlobalPlayerContext'
import { VIDEOS } from '../data/videos'
import useBgFit from '../hooks/useBgFit'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseDuration(str) {
  if (!str) return 0
  const parts = str.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

function Videos() {
  const { toggleFavoriteVideo, isFavoriteVideo } = useContext(FavoritesContext)
  const { currentMedia, mediaType, isPlaying, currentTime, duration, playMedia, pauseMedia, handleProgress, volume, setVolume, isMuted, setIsMuted } = useContext(GlobalPlayerContext)
  const [fullscreenVideo, setFullscreenVideo] = useState(null)
  const [fsVolume, setFsVolume] = useState(volume ?? 0.8)
  const [fsMuted, setFsMuted] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const controlsTimer = useRef(null)
  const progressRef = useRef(null)
  const volumeRef = useRef(null)

  const isVidPlaying = (vidId) => currentMedia?.id === vidId && mediaType === 'video' && isPlaying

  const handleVideoClick = (vid) => {
    if (isVidPlaying(vid.id)) {
      pauseMedia()
    } else {
      playMedia(vid, 'video')
    }
  }

  const openFullscreen = (e, vid) => {
    e.stopPropagation()
    setFullscreenVideo(vid)
    setControlsVisible(true)
  }

  const closeFullscreen = () => {
    setFullscreenVideo(null)
  }

  // Navigate videos
  const fsIndex = fullscreenVideo ? VIDEOS.findIndex(v => v.id === fullscreenVideo.id) : -1

  const goPrev = useCallback(() => {
    if (fsIndex <= 0) return
    const prev = VIDEOS[fsIndex - 1]
    setFullscreenVideo(prev)
    playMedia(prev, 'video')
  }, [fsIndex, playMedia])

  const goNext = useCallback(() => {
    if (fsIndex >= VIDEOS.length - 1) return
    const next = VIDEOS[fsIndex + 1]
    setFullscreenVideo(next)
    playMedia(next, 'video')
  }, [fsIndex, playMedia])

  // Progress bar click
  const handleProgressClick = (e) => {
    if (mediaType !== 'video' || !fullscreenVideo) return
    handleProgress(e, progressRef)
  }

  // Volume bar click
  const handleVolumeClick = (e) => {
    if (!volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (setVolume) setVolume(ratio)
    setFsVolume(ratio)
    if (setIsMuted) setIsMuted(ratio === 0)
    setFsMuted(ratio === 0)
  }

  const toggleMute = () => {
    const next = !fsMuted
    setFsMuted(next)
    if (setIsMuted) setIsMuted(next)
  }

  // Auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true)
    if (controlsTimer.current) clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    if (!fullscreenVideo) return
    showControls()
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current)
    }
  }, [fullscreenVideo, showControls])

  useEffect(() => {
    if (!fullscreenVideo) {
      document.body.classList.remove('video-fullscreen-open')
      return
    }

    document.body.classList.add('video-fullscreen-open')
    return () => {
      document.body.classList.remove('video-fullscreen-open')
    }
  }, [fullscreenVideo])

  // Keyboard controls
  useEffect(() => {
    if (!fullscreenVideo) return
    const handler = (e) => {
      if (e.key === 'Escape') closeFullscreen()
      if (e.key === ' ') {
        e.preventDefault()
        if (isVidPlaying(fullscreenVideo.id)) pauseMedia()
        else playMedia(fullscreenVideo, 'video')
      }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'm' || e.key === 'M') toggleMute()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreenVideo, goNext, goPrev])

  // Derive progress
  const isCurrentVidInPlayer = fullscreenVideo && currentMedia?.id === fullscreenVideo.id && mediaType === 'video'
  const progress = isCurrentVidInPlayer && duration > 0 ? (currentTime / duration) * 100 : 0
  const totalDuration = isCurrentVidInPlayer ? duration : parseDuration(fullscreenVideo?.duration)
  const displayTime = isCurrentVidInPlayer ? currentTime : 0
  const displayVolume = fsMuted ? 0 : (fsVolume ?? 0.8)

  const bgRef = useBgFit('/backgrounds/videos-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="page-container videos-page"
      style={{ '--bg-image': 'url(/backgrounds/videos-bg.jpg)' }}
    >
      <h1 className="page-header">VIDEOS</h1>
      <p className="videos-subtitle">
        Visuals, behind the scenes & more.
      </p>

      <div className="videos-grid">
        {VIDEOS.map((vid) => (
          <div
            key={vid.id}
            className={`video-card ${currentMedia?.id === vid.id && mediaType === 'video' ? 'active' : ''}`}
            onClick={() => handleVideoClick(vid)}
          >
            <div className="video-thumb">
              <div className="video-thumb-placeholder">
                <Film size={36} opacity={0.3} />
                <span className="video-duration-badge">{vid.duration}</span>
              </div>
              <div className="video-play-overlay">
                {isVidPlaying(vid.id) ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
              </div>
              <button 
                className={`favorite-btn ${isFavoriteVideo(vid.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavoriteVideo(vid.id)
                }}
                aria-label="Toggle Favorite"
              >
                <Heart size={20} fill={isFavoriteVideo(vid.id) ? "currentColor" : "none"} />
              </button>
              <button
                className="video-fullscreen-btn"
                onClick={(e) => openFullscreen(e, vid)}
                aria-label="Open fullscreen"
                title="Watch fullscreen"
              >
                <Maximize2 size={18} />
              </button>
            </div>
            <div className="video-info">
              <span className="video-title">{vid.title}</span>
              <span className="video-duration">{vid.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════ Fullscreen Video Modal ══════ */}
      {fullscreenVideo && (
        <div
          className="vfs-backdrop"
          onClick={closeFullscreen}
          onMouseMove={showControls}
        >
          {/* Close button */}
          <button className="vfs-close" onClick={closeFullscreen} aria-label="Close">
            <X size={22} />
          </button>

          {/* Main container */}
          <div className="vfs-container" onClick={(e) => e.stopPropagation()}>
            {/* Video area */}
            <div
              className="vfs-player"
              onMouseMove={showControls}
              onClick={() => {
                if (isVidPlaying(fullscreenVideo.id)) pauseMedia()
                else playMedia(fullscreenVideo, 'video')
              }}
            >
              {/* Placeholder visual */}
              <div className={`vfs-visual ${isVidPlaying(fullscreenVideo.id) ? 'hidden' : ''}`}>
                <Film size={80} opacity={0.15} />
              </div>

              {/* ── Controls overlay ── */}
              <div className={`vfs-controls-wrap ${controlsVisible ? 'visible' : ''}`}>
                {/* Center play button */}
                <button
                  className={`vfs-center-play ${isVidPlaying(fullscreenVideo.id) ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isVidPlaying(fullscreenVideo.id)) pauseMedia()
                    else playMedia(fullscreenVideo, 'video')
                  }}
                >
                  {isVidPlaying(fullscreenVideo.id) ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" />}
                </button>

                {/* Top gradient + title */}
                <div className="vfs-top-bar">
                  <div className="vfs-top-title">{fullscreenVideo.title}</div>
                  <button
                    className={`vfs-fav-btn ${isFavoriteVideo(fullscreenVideo.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavoriteVideo(fullscreenVideo.id)
                    }}
                  >
                    <Heart size={18} fill={isFavoriteVideo(fullscreenVideo.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Bottom controls */}
                <div className="vfs-bottom-controls" onClick={(e) => e.stopPropagation()}>
                  {/* Progress bar */}
                  <div
                    className="vfs-progress"
                    ref={progressRef}
                    onClick={handleProgressClick}
                  >
                    <div className="vfs-progress-track">
                      <div className="vfs-progress-fill" style={{ width: `${progress}%` }} />
                      <div className="vfs-progress-thumb" style={{ left: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Controls row */}
                  <div className="vfs-controls-row">
                    {/* Left: Play controls + time */}
                    <div className="vfs-controls-left">
                      <button
                        className="vfs-ctrl-btn"
                        onClick={goPrev}
                        disabled={fsIndex <= 0}
                        title="Previous video"
                      >
                        <SkipBack size={20} />
                      </button>
                      <button
                        className="vfs-ctrl-btn vfs-play-btn"
                        onClick={() => {
                          if (isVidPlaying(fullscreenVideo.id)) pauseMedia()
                          else playMedia(fullscreenVideo, 'video')
                        }}
                      >
                        {isVidPlaying(fullscreenVideo.id) ? <Pause size={22} /> : <Play size={22} />}
                      </button>
                      <button
                        className="vfs-ctrl-btn"
                        onClick={goNext}
                        disabled={fsIndex >= VIDEOS.length - 1}
                        title="Next video"
                      >
                        <SkipForward size={20} />
                      </button>
                      <div className="vfs-time">
                        <span>{formatTime(displayTime)}</span>
                        <span className="vfs-time-sep">/</span>
                        <span>{formatTime(totalDuration)}</span>
                      </div>
                    </div>

                    {/* Right: Volume + minimize */}
                    <div className="vfs-controls-right">
                      <button className="vfs-ctrl-btn" onClick={toggleMute} title={fsMuted ? 'Unmute' : 'Mute'}>
                        {fsMuted || displayVolume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                      <div
                        className="vfs-volume"
                        ref={volumeRef}
                        onClick={handleVolumeClick}
                      >
                        <div className="vfs-volume-track">
                          <div className="vfs-volume-fill" style={{ width: `${displayVolume * 100}%` }} />
                          <div className="vfs-volume-thumb" style={{ left: `${displayVolume * 100}%` }} />
                        </div>
                      </div>
                      <button className="vfs-ctrl-btn" onClick={closeFullscreen} title="Exit fullscreen">
                        <Minimize2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Videos
