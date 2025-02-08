import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAudioStore = create(
  persist(
    (set, get) => ({
      // Audio state
      volume: 0.9,
      playlist: [],
      currentTrackId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      audioElement: null,

      // Store state setters
      setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => {
        if (get().audioElement) {
          get().audioElement.volume = volume
        }
        set({ volume })
      },
      setPlaylist: (playlist) => set({ playlist }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setAudioElement: (element) => set({ audioElement: element }),
      
      // Audio actions
      play: (trackId) => {
        const state = get()
        if (state.audioElement) {
          state.audioElement.play()
        }
        set({ currentTrackId: trackId, isPlaying: true })
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
        const currentIndex = state.playlist.indexOf(state.currentTrackId)
        if (currentIndex < state.playlist.length - 1) {
          state.play(state.playlist[currentIndex + 1])
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
        if (!state.playlist.find(t => t === track.id)) {
          set({ playlist: [...state.playlist, track.id] })
        }
      },

      removeFromPlaylist: (trackId) => {
        const state = get()
        set({ playlist: state.playlist.filter(id => id !== trackId) })
      },

      clearPlaylist: () => set({ playlist: [] }),

      playNext: () => {
        const state = get()
        const currentIndex = state.playlist.indexOf(state.currentTrackId)
        if (currentIndex < state.playlist.length - 1) {
          state.play(state.playlist[currentIndex + 1])
        }
      },

      playPrevious: () => {
        const state = get()
        const currentIndex = state.playlist.indexOf(state.currentTrackId)
        if (currentIndex > 0) {
          state.play(state.playlist[currentIndex - 1])
        }
      },

      addMultipleToPlaylist: (tracks) => {
        const state = get()
        const uniqueTrackIds = tracks
          .map(track => track.id)
          .filter(trackId => !state.playlist.includes(trackId))
        if (uniqueTrackIds.length > 0) {
          set({ playlist: [...state.playlist, ...uniqueTrackIds] })
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

if (!Array.isArray(useAudioStore.getState().playlist)) {
  useAudioStore.setState({ playlist: [] })
}

subscribe((state) => {
  console.log("Audio store updated:", state)
})

window.store = useAudioStore

export default useAudioStore
