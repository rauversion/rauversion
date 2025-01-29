import create from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

const useAudioStore = create(
  persist(
    (set, get) => ({
      // Existing state from application.js
      volume: 0.9,
      playlist: [],
      
      // New audio state
      currentTrackId: null,
      isPlaying: false,

      // Store state setters
      setCurrentTrack: (trackId) => set({ currentTrackId: trackId }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => set({ volume }),
      setPlaylist: (playlist) => set({ playlist }),
      
      // Audio actions
      play: (trackId) => set({ currentTrackId: trackId, isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      finish: () => set({ isPlaying: false }),
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


subscribe((v) => {
  console.log("value changes", v)
})

window.store = useAudioStore

export default useAudioStore
