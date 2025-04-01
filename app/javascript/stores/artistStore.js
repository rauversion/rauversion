import { create } from 'zustand'
import { get } from '@rails/request.js'

const useArtistStore = create((set) => ({
  artist: null,
  childArtists: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  hasMore: true,

  setArtist: (artist) => {
    set({ artist })
  },

  fetchArtists: async (username, page = 1) => {
    set({ loading: true })
    try {
      const response = await get(`/${username}/artists.json`, {
        query: { page }
      })
      const data = await response.json

      set((state) => ({
        childArtists: page === 1 ? data.collection : [...state.childArtists, ...data.collection],
        artist: data.artist || state.artist,
        currentPage: data.metadata.current_page,
        totalPages: data.metadata.total_pages,
        hasMore: !data.metadata.is_last_page,
        error: null
      }))
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  reset: () => {
    set({
      artist: null,
      childArtists: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      hasMore: true
    })
  }
}))

export default useArtistStore
