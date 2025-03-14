import { create } from 'zustand'
import { get as apiGet, destroy } from '@rails/request.js'

const useAuthStore = create((set, get) => ({
  currentUser: null,
  labelUser: null,
  cartItemCount: 0,
  i18n: { locale: 'en' },
  env: {},
  loading: true,
  error: null,

  // Initialize auth state
  initAuth: async () => {
    
    try {
      set({ loading: true })
      const response = await apiGet('/api/v1/me.json')
      
      if (response.ok) {

        const data = await response.json
        
        set({ 
          currentUser: data.current_user,
          labelUser: data.label_user,
          cartItemCount: data.cart_item_count,
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
          loading: false,
          error: 'Failed to load user data'
        })
      }
    } catch (error) {
      set({ 
        currentUser: null,
        labelUser: null,
        cartItemCount: 0,
        loading: false,
        error: error.message
      })
    }
  },


  // Sign out
  signOut: async () => {
    try {
      const response = await destroy('/users/sign_out.json')

      if (response.ok) {
        set({ 
          currentUser: null,
          labelUser: null,
          cartItemCount: 0,
          loading: false,
          error: null
        })

        const newCsrfToken = response.headers.get("X-CSRF-Token");
        if (newCsrfToken) {
          updateCsrfToken(newCsrfToken);
          window.location.reload();
        }
      }
    } catch (error) {
      set({ error: error.message })
    }
  },

  // Update cart item count
  updateCartItemCount: (count) => {
    set({ cartItemCount: count })
  },

  setCurrentUser: (user) => {
    set({ currentUser: user })
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
