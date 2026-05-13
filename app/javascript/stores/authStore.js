import { create } from 'zustand'
import { get as apiGet, destroy } from '@rails/request.js'

let authRequestId = 0

const useAuthStore = create((set, get) => ({
  currentUser: null,
  labelUser: null,
  cartItemCount: 0,
  unreadMessagesCount: 0,
  i18n: { locale: 'en' },
  env: {},
  loading: true,
  error: null,

  // Initialize auth state
  initAuth: async () => {
    const requestId = ++authRequestId
    
    try {
      set({ loading: true })
      const response = await apiGet('/api/v1/me.json')

      if (requestId !== authRequestId) return
      
      if (response.ok) {

        const data = await response.json
        
        set({ 
          currentUser: data.current_user,
          labelUser: data.label_user,
          cartItemCount: data.cart_item_count,
          unreadMessagesCount: data.current_user?.unread_messages_count || 0,
          i18n: data.i18n,
          env: data.env,
          loading: false,
          error: null
        })
      } else {
        set({ 
          currentUser: null,
          labelUser: null,
          cartItemCount: 0,
          unreadMessagesCount: 0,
          loading: false,
          error: 'Failed to load user data'
        })
      }
    } catch (error) {
      if (requestId !== authRequestId) return

      set({ 
        currentUser: null,
        labelUser: null,
        cartItemCount: 0,
        unreadMessagesCount: 0,
        loading: false,
        error: error.message
      })
    }
  },


  // Sign out
  signOut: async () => {
    authRequestId += 1

    try {
      const response = await destroy('/users/sign_out.json')

      if (response.ok) {
        set({ 
          currentUser: null,
          labelUser: null,
          cartItemCount: 0,
          unreadMessagesCount: 0,
          loading: false,
          error: null
        })

        const newCsrfToken = response.headers.get("X-CSRF-Token");
        if (newCsrfToken) {
          get().updateCsrfToken(newCsrfToken);
        }
      }
    } catch (error) {
      set({ loading: false, error: error.message })
    }
  },

  // Update cart item count
  updateCartItemCount: (count) => {
    set({ cartItemCount: count })
  },

  // Update unread messages count
  updateUnreadMessagesCount: (count) => {
    set({ unreadMessagesCount: count })
  },

  // Increment unread messages count
  incrementUnreadMessagesCount: () => {
    set((state) => ({ unreadMessagesCount: state.unreadMessagesCount + 1 }))
  },

  // Decrement unread messages count
  decrementUnreadMessagesCount: () => {
    set((state) => ({ 
      unreadMessagesCount: Math.max(0, state.unreadMessagesCount - 1) 
    }))
  },

  setCurrentUser: (user) => {
    authRequestId += 1
    set({ currentUser: user, loading: false })
  },

  // Clear any errors
  clearError: () => {
    set({ error: null })
  },

  // Helper functions
  isAuthenticated: () => {
    return !!get().currentUser
  },

  isAdmin: () => {
    return get().currentUser?.is_admin || false
  },

  isCreator: () => {
    return get().currentUser?.is_creator || false
  },

  canSellProducts: () => {
    return get().currentUser?.can_sell_products || false
  },

  isLabel: () => {
    return get().currentUser?.label || false
  },

  isEditor: () => {
    return get().currentUser?.editor || false
  },
  updateCsrfToken: (token) => {
    document.querySelector('meta[name="csrf-token"]').setAttribute("content", token);
    localStorage.setItem("csrfToken", token);
  }
  
}))

export default useAuthStore
