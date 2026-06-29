import React, { createContext, useState, useEffect } from 'react'

export const FavoritesContext = createContext({
  favoritePhotos: [],
  favoriteTracks: [],
  favoriteVideos: [],
  toggleFavoritePhoto: () => {},
  toggleFavoriteTrack: () => {},
  toggleFavoriteVideo: () => {},
  isFavoritePhoto: () => false,
  isFavoriteTrack: () => false,
  isFavoriteVideo: () => false
})

export const FavoritesProvider = ({ children }) => {
  const [favoritePhotos, setFavoritePhotos] = useState(() => {
    try {
      const saved = localStorage.getItem('skye-rackz-fav-photos')
      // fallback to old key for photos if new doesn't exist
      if (!saved) {
        const old = localStorage.getItem('skye-rackz-favorites')
        return old ? JSON.parse(old) : []
      }
      return JSON.parse(saved)
    } catch (e) {
      return []
    }
  })

  const [favoriteTracks, setFavoriteTracks] = useState(() => {
    try {
      const saved = localStorage.getItem('skye-rackz-fav-tracks')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  const [favoriteVideos, setFavoriteVideos] = useState(() => {
    try {
      const saved = localStorage.getItem('skye-rackz-fav-videos')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('skye-rackz-fav-photos', JSON.stringify(favoritePhotos))
  }, [favoritePhotos])

  useEffect(() => {
    localStorage.setItem('skye-rackz-fav-tracks', JSON.stringify(favoriteTracks))
  }, [favoriteTracks])

  useEffect(() => {
    localStorage.setItem('skye-rackz-fav-videos', JSON.stringify(favoriteVideos))
  }, [favoriteVideos])

  const toggleFavoritePhoto = (id) => {
    setFavoritePhotos(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const toggleFavoriteTrack = (id) => {
    setFavoriteTracks(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const toggleFavoriteVideo = (id) => {
    setFavoriteVideos(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const isFavoritePhoto = (id) => favoritePhotos.includes(id)
  const isFavoriteTrack = (id) => favoriteTracks.includes(id)
  const isFavoriteVideo = (id) => favoriteVideos.includes(id)

  return (
    <FavoritesContext.Provider value={{
      favoritePhotos, favoriteTracks, favoriteVideos,
      toggleFavoritePhoto, toggleFavoriteTrack, toggleFavoriteVideo,
      isFavoritePhoto, isFavoriteTrack, isFavoriteVideo
    }}>
      {children}
    </FavoritesContext.Provider>
  )
}
