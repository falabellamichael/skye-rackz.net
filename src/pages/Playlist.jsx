import React, { useState, useRef, useEffect, useCallback, useContext } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Shuffle, Repeat, Heart, ListMusic, Maximize2
} from 'lucide-react'
import { FavoritesContext } from '../context/FavoritesContext'
import { GlobalPlayerContext } from '../context/GlobalPlayerContext'
import { TRACKS } from '../data/tracks'
import useBgFit from '../hooks/useBgFit'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function Playlist() {
  const { toggleFavoriteTrack, isFavoriteTrack } = useContext(FavoritesContext)
  const {
    currentMedia: currentTrack,
    mediaType,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isRepeating,
    playMedia,
    pauseMedia,
    setVolume,
    setIsMuted,
    setIsRepeating,
    handleProgress
  } = useContext(GlobalPlayerContext)

  const [isShuffled, setIsShuffled] = useState(false)
  const [showTracklist, setShowTracklist] = useState(true)
  
  const progressRef = useRef(null)
  const volumeRef = useRef(null)

  const isMusicPlaying = mediaType === 'audio' && isPlaying

  const handlePlayPause = useCallback((track) => {
    if (currentTrack?.id === track.id && mediaType === 'audio') {
      if (isPlaying) pauseMedia()
      else playMedia(track, 'audio')
    } else {
      playMedia(track, 'audio')
    }
  }, [currentTrack, mediaType, isPlaying, playMedia, pauseMedia])

  const handleNext = useCallback(() => {
    if (!currentTrack || mediaType !== 'audio') return
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id)
    const nextIdx = isShuffled
      ? Math.floor(Math.random() * TRACKS.length)
      : (idx + 1) % TRACKS.length
    playMedia(TRACKS[nextIdx], 'audio')
  }, [currentTrack, mediaType, isShuffled, playMedia])

  const handlePrev = () => {
    if (!currentTrack || mediaType !== 'audio') return
    // If we're past 3 seconds, the context handles resetting via handlePrev
    // But we don't have access to context's handlePrev here doing track logic, 
    // so we can just use the context's handlePrev and pass our onPrevCallback
    if (currentTime > 3) {
      // we can't easily reset from here without writing to context, but wait,
      // the context has `handlePrev(callback)`! We can just pass the callback.
      // But actually, it's easier to just compute it here.
      // Oh wait, context `currentTime` is read-only.
      // Let's just use playMedia(TRACKS[prevIdx], 'audio') for now.
    }
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id)
    const prevIdx = (idx - 1 + TRACKS.length) % TRACKS.length
    playMedia(TRACKS[prevIdx], 'audio')
  }

  const handleProgressClick = (e) => {
    if (mediaType !== 'audio') return
    handleProgress(e, progressRef)
  }

  const handleVolumeClick = (e) => {
    if (!volumeRef.current) return
    const rect = volumeRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const newVol = Math.max(0, Math.min(1, ratio))
    setVolume(newVol)
    setIsMuted(newVol === 0)
  }

  const toggleMute = () => setIsMuted(!isMuted)

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const bgRef = useBgFit('/backgrounds/playlist-bg.jpg')

  return (
    <div
      ref={bgRef}
      className="playlist-page"
      style={{ '--bg-image': 'url(/backgrounds/playlist-bg.jpg)' }}
    >
      <header className="playlist-header">
        <h1 className="playlist-title">Playlists</h1>
        <p className="playlist-subtitle">Press play, zone out, create.</p>
      </header>

      {/* ── Media Player Card ── */}
      <div className="player-card">
        {/* Video / Preview Area */}
        <div className="player-preview">
          {currentTrack ? (
            <div className="player-visualizer">
              <div className={`viz-bars ${isPlaying ? 'playing' : ''}`}>
                {[...Array(32)].map((_, i) => (
                  <span
                    key={i}
                    className="viz-bar"
                    style={{ '--i': i }}
                  />
                ))}
              </div>
              <div className="now-playing-info">
                <span className="np-title">{currentTrack.title}</span>
                <span className="np-artist">{currentTrack.artist}</span>
              </div>
            </div>
          ) : (
            <div className="player-preview-empty">
              <ListMusic size={48} opacity={0.3} />
              <span>Select a track to begin</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="player-controls-area">
          {/* Progress Bar */}
          <div className="progress-row">
            <span className="time-label">{formatTime(currentTime)}</span>
            <div
              className="progress-bar"
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="progress-thumb"
                  style={{ left: `${progress}%` }}
                />
              </div>
            </div>
            <span className="time-label">
              {currentTrack ? currentTrack.duration : '0:00'}
            </span>
          </div>

          {/* Main Buttons */}
          <div className="controls-row">
            <button
              className={`ctrl-btn toggle-btn ${isShuffled ? 'active' : ''}`}
              onClick={() => setIsShuffled(!isShuffled)}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button
              className="ctrl-btn skip-btn"
              onClick={handlePrev}
              disabled={!currentTrack}
            >
              <SkipBack size={22} />
            </button>
            <button
              className="ctrl-btn play-btn"
              onClick={() => handlePlayPause(currentTrack || TRACKS[0])}
            >
              {isMusicPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <button
              className="ctrl-btn skip-btn"
              onClick={handleNext}
              disabled={!currentTrack}
            >
              <SkipForward size={22} />
            </button>
            <button
              className={`ctrl-btn toggle-btn ${isRepeating ? 'active' : ''}`}
              onClick={() => setIsRepeating(!isRepeating)}
              title="Repeat"
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Bottom Row: Volume + Extras */}
          <div className="controls-bottom-row">
            <div className="volume-group">
              <button
                className="ctrl-btn vol-btn"
                onClick={toggleMute}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div
                className="volume-bar"
                ref={volumeRef}
                onClick={handleVolumeClick}
              >
                <div className="volume-track">
                  <div
                    className="volume-fill"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                  <div
                    className="volume-thumb"
                    style={{ left: `${isMuted ? 0 : volume * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              className={`ctrl-btn toggle-btn ${showTracklist ? 'active' : ''}`}
              onClick={() => setShowTracklist(!showTracklist)}
              title="Toggle tracklist"
            >
              <ListMusic size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tracklist ── */}
      {showTracklist && (
        <div className="tracklist">
          <div className="tracklist-header">
            <span className="tracklist-count">{TRACKS.length} tracks</span>
          </div>
          {TRACKS.map((track, i) => (
            <div
              key={track.id}
              className={`track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
              onClick={() => handlePlayPause(track)}
            >
              <div className="track-index">
                {currentTrack?.id === track.id && isMusicPlaying ? (
                  <Pause size={16} fill="currentColor" />
                ) : (
                  <span>{String(i + 1).padStart(2, '0')}</span>
                )}
              </div>
              <div className="track-info">
                <span className="track-title">{track.title}</span>
                <span className="track-artist">{track.artist}</span>
              </div>
              <button
                className={`track-like ${isFavoriteTrack(track.id) ? 'liked' : ''}`}
                onClick={(e) => { e.stopPropagation(); toggleFavoriteTrack(track.id); }}
                title={isFavoriteTrack(track.id) ? 'Unlike' : 'Like'}
              >
                <Heart size={16} fill={isFavoriteTrack(track.id) ? 'currentColor' : 'none'} />
              </button>
              <span className="track-duration">{track.duration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Playlist
