import { create } from 'zustand'

// Track interface for DJ Decks
export interface DeckTrack {
  id: number
  title: string
  artist: string
  streamUrl: string
  duration?: number
  bpm?: number
  key?: string
}

interface DjDecksStore {
  // Pending tracks to load into decks
  pendingDeckA: DeckTrack | null
  pendingDeckB: DeckTrack | null
  
  // Actions
  addToDeckA: (track: DeckTrack) => void
  addToDeckB: (track: DeckTrack) => void
  clearPendingDeckA: () => void
  clearPendingDeckB: () => void
}

const useDjDecksStore = create<DjDecksStore>((set) => ({
  pendingDeckA: null,
  pendingDeckB: null,
  
  addToDeckA: (track) => set({ pendingDeckA: track }),
  addToDeckB: (track) => set({ pendingDeckB: track }),
  clearPendingDeckA: () => set({ pendingDeckA: null }),
  clearPendingDeckB: () => set({ pendingDeckB: null }),
}))

export default useDjDecksStore
