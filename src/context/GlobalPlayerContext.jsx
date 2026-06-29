import React, { createContext, useState, useRef, useEffect, useCallback } from 'react'

export const GlobalPlayerContext = createContext()

function parseDuration(durationStr) {
  if (!durationStr) return 0
  const parts = durationStr.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
  }
  return 0
}

export const GlobalPlayerProvider = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'audio' or 'video'
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  
  const audioRef = useRef(null)
  const simRef = useRef(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    const audio = audioRef.current

    audio.volume = volume

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0
        audio.play()
      } else {
        // Here we could implement an auto-next feature, but for now just stop
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
    }
  }, [isRepeating])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const stopSimulation = () => {
    if (simRef.current) {
      clearInterval(simRef.current)
      simRef.current = null
    }
  }

  const simulatePlayback = (track) => {
    stopSimulation()
    const fakeDuration = parseDuration(track.duration)
    setDuration(fakeDuration)
    let time = 0
    setCurrentTime(time)
    
    simRef.current = setInterval(() => {
      time += 1
      setCurrentTime(time)
      if (time >= fakeDuration) {
        stopSimulation()
        if (isRepeating) {
          simulatePlayback(track)
        } else {
          setIsPlaying(false)
        }
      }
    }, 1000)
  }

  const resumeSimulation = () => {
    stopSimulation()
    const fakeDuration = duration
    let time = currentTime
    
    simRef.current = setInterval(() => {
      time += 1
      setCurrentTime(time)
      if (time >= fakeDuration) {
        stopSimulation()
        if (isRepeating) {
          simulatePlayback(currentMedia)
        } else {
          setIsPlaying(false)
        }
      }
    }, 1000)
  }

  const playMedia = useCallback((media, type = 'audio') => {
    const audio = audioRef.current
    if (!audio) return

    // If different media
    if (!currentMedia || currentMedia.id !== media.id || mediaType !== type) {
      // Pause any existing playback
      if (mediaType === 'audio') {
        audio.pause()
        stopSimulation()
      } else if (mediaType === 'video') {
        // Video specific cleanup if needed (e.g. YouTube API)
      }

      setCurrentMedia(media)
      setMediaType(type)
      setCurrentTime(0)

      if (type === 'audio') {
        if (media.src) {
          audio.src = media.src
          audio.play().then(() => setIsPlaying(true)).catch(e => console.warn(e))
        } else {
          setIsPlaying(true)
          simulatePlayback(media)
        }
      } else if (type === 'video') {
        // Placeholder video behavior (since we don't have iframes yet)
        setIsPlaying(true)
        // We can simulate video time as well if needed
        simulatePlayback(media) 
      }
    } else {
      // Toggle play/pause for current media
      if (isPlaying) {
        if (type === 'audio') {
          audio.pause()
          stopSimulation()
        }
        setIsPlaying(false)
      } else {
        if (type === 'audio') {
          if (media.src) {
            audio.play().then(() => setIsPlaying(true)).catch(e => console.warn(e))
          } else {
            setIsPlaying(true)
            resumeSimulation()
          }
        } else if (type === 'video') {
          setIsPlaying(true)
          resumeSimulation()
        }
      }
    }
  }, [currentMedia, mediaType, isPlaying, duration, currentTime, isRepeating])

  const pauseMedia = useCallback(() => {
    setIsPlaying(false)
    if (mediaType === 'audio') {
      audioRef.current?.pause()
      stopSimulation()
    } else if (mediaType === 'video') {
      stopSimulation()
    }
  }, [mediaType])

  const closeMedia = useCallback(() => {
    pauseMedia()
    setCurrentMedia(null)
    setMediaType(null)
    setCurrentTime(0)
  }, [pauseMedia])

  const handleProgress = useCallback((e, progressRef) => {
    if (!progressRef.current || !currentMedia) return
    const rect = progressRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = x / rect.width
    const newTime = percentage * duration
    setCurrentTime(newTime)

    if (mediaType === 'audio' && currentMedia.src) {
      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    } else {
      // For simulation (both audio without src, and video placeholders)
      if (isPlaying) {
        resumeSimulation()
      }
    }
  }, [currentMedia, mediaType, duration, isPlaying])

  const handleNext = useCallback((onNextCallback) => {
    // If the caller provides a next callback (e.g. Playlist component), we use it.
    // Otherwise we just stop since we don't have the full tracklist globally.
    if (onNextCallback) {
      onNextCallback()
    } else {
      pauseMedia()
    }
  }, [pauseMedia])

  const handlePrev = useCallback((onPrevCallback) => {
    if (currentTime > 3) {
      setCurrentTime(0)
      if (mediaType === 'audio' && currentMedia?.src && audioRef.current) {
        audioRef.current.currentTime = 0
      }
    } else if (onPrevCallback) {
      onPrevCallback()
    } else {
      setCurrentTime(0)
    }
  }, [currentTime, currentMedia, mediaType])

  return (
    <GlobalPlayerContext.Provider value={{
      currentMedia,
      mediaType,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isRepeating,
      playMedia,
      pauseMedia,
      closeMedia,
      setVolume,
      setIsMuted,
      setIsRepeating,
      handleProgress,
      handleNext,
      handlePrev
    }}>
      {children}
    </GlobalPlayerContext.Provider>
  )
}
