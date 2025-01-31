import { create } from 'zustand'
import { get } from '@rails/request.js'

const useAuthStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Initialize auth state
  initAuth: async () => {
    try {
      const response = await get('/api/me.json')
      if (response.ok) {
        const data = await response.json
        set({ 
          currentUser: data.user,
          isAuthenticated: true,
          loading: false,
          error: null
        })
      } else {
        set({ 
          currentUser: null,
          isAuthenticated: false,
          loading: false,
          error: null
        })
      }
    } catch (error) {
      set({ 
        currentUser: null,
        isAuthenticated: false,
        loading: false,
        error: error.message
      })
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const response = await fetch('/users/sign_out', {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })
      
      if (response.ok) {
        set({ 
          currentUser: null,
          isAuthenticated: false,
          loading: false,
          error: null
        })
        window.location.href = '/'
      }
    } catch (error) {
      set({ error: error.message })
    }
  },

  // Update current user data
  updateCurrentUser: (userData) => {
    set({ 
      currentUser: { ...get().currentUser, ...userData },
      error: null
    })
  },

  // Clear any errors
  clearError: () => set({ error: null }),

  // Check if user has a specific role
  hasRole: (role) => {
    const { currentUser } = get()
    return currentUser?.roles?.includes(role) || false
  },

  // Check if user owns a resource
  isOwner: (resourceUserId) => {
    const { currentUser } = get()
    return currentUser?.id === resourceUserId
  }
}))

export default useAuthStore
