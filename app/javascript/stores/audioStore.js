import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const normalizeTrackId = (trackId) => {
  if (trackId === null || trackId === undefined) return null

  return `${trackId}`
}

const normalizePlaylist = (playlist) => {
  if (!Array.isArray(playlist)) return []

  return playlist
    .map((trackId) => normalizeTrackId(trackId))
    .filter(Boolean)
}

const findCurrentTrackIndex = (state) => {
  const playlist = normalizePlaylist(state.playlist)
  const currentTrackId = normalizeTrackId(state.currentTrackId)

  return {
    playlist,
    currentIndex: playlist.indexOf(currentTrackId),
  }
}

const useAudioStore = create(
  persist(
    (set, get) => ({
      // Audio state
      volume: 0.9,
      playlist: [],
      currentTrackId: null,
      currentTrackMeta: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      audioElement: null,

      // Store state setters
      setCurrentTrack: (trackId) => set({ currentTrackId: normalizeTrackId(trackId) }),
      setCurrentTrackMeta: (trackMeta) => set({ currentTrackMeta: trackMeta }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => {
        if (get().audioElement) {
          get().audioElement.volume = volume
        }
        set({ volume })
      },
      setPlaylist: (playlist) => set({ playlist: normalizePlaylist(playlist) }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setAudioElement: (element) => set({ audioElement: element }),
      
      // Audio actions
      play: (trackId) => {
        const state = get()
        const normalizedTrackId = normalizeTrackId(trackId)
        if (state.audioElement) {
          state.audioElement.play()
        }
        set({ currentTrackId: normalizedTrackId, isPlaying: true })
      },
      
      pause: () => {
        const state = get()
        if (state.audioElement) {
          state.audioElement.pause()
        }
        set({ isPlaying: false })
      },
      
      togglePlay: () => {
        const state = get()
        if (state.isPlaying) {
          state.pause()
        } else {
          state.play(state.currentTrackId)
        }
      },
      
      finish: () => {
        set({ isPlaying: false, currentTime: 0 })
        const state = get()
        const { playlist, currentIndex } = findCurrentTrackIndex(state)

        if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
          state.play(playlist[currentIndex + 1])
        }
      },

      // Utility functions
      audioPlaying: () => {
        const state = get()
        return state.isPlaying && state.audioElement && !state.audioElement.paused
      },

      formatTime: (time) => {
        if (!time) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      },

      // Playlist management
      addToPlaylist: (track) => {
        const state = get()
        const trackId = normalizeTrackId(track?.id ?? track)

        if (!trackId) return

        const playlist = normalizePlaylist(state.playlist)

        if (!playlist.includes(trackId)) {
          set({ playlist: [...playlist, trackId] })
        }
      },

      removeFromPlaylist: (trackId) => {
        const state = get()
        const normalizedTrackId = normalizeTrackId(trackId)
        const playlist = normalizePlaylist(state.playlist)

        set({ playlist: playlist.filter((id) => id !== normalizedTrackId) })
      },

      clearPlaylist: () => set({ playlist: [] }),

      playNext: () => {
        const state = get()
        const { playlist, currentIndex } = findCurrentTrackIndex(state)

        if (currentIndex >= 0 && currentIndex < playlist.length - 1) {
          state.play(playlist[currentIndex + 1])
        }
      },

      playPrevious: () => {
        const state = get()
        const { playlist, currentIndex } = findCurrentTrackIndex(state)

        if (currentIndex > 0) {
          state.play(playlist[currentIndex - 1])
        }
      },

      addMultipleToPlaylist: (tracks) => {
        const state = get()
        const playlist = normalizePlaylist(state.playlist)
        const uniqueTrackIds = tracks
          .map((track) => normalizeTrackId(track?.id ?? track))
          .filter((trackId) => trackId && !playlist.includes(trackId))

        if (uniqueTrackIds.length > 0) {
          set({ playlist: [...playlist, ...uniqueTrackIds] })
        }
      }
    }),
    {
      name: 'rau-ror-storage',
      getStorage: () => localStorage
    }
  )
)

const { getState, setState, subscribe, destroy } = useAudioStore

const persistedState = useAudioStore.getState()
const normalizedPlaylist = normalizePlaylist(persistedState.playlist)
const normalizedCurrentTrackId = normalizeTrackId(persistedState.currentTrackId)

if (
  !Array.isArray(persistedState.playlist) ||
  normalizedPlaylist.length !== persistedState.playlist.length ||
  normalizedCurrentTrackId !== persistedState.currentTrackId
) {
  useAudioStore.setState({
    playlist: normalizedPlaylist,
    currentTrackId: normalizedCurrentTrackId,
  })
}

subscribe((state) => {
  console.log("Audio store updated:", state)
})

window.store = useAudioStore

export default useAudioStore
