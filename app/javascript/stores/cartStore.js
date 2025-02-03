import { create } from 'zustand'
import { get as apiGet, post, destroy } from '@rails/request.js'

const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true })
    try {
      const response = await apiGet('/product_cart.json')
      if (response.ok) {
        const data = await response.json
        set({ cart: data.cart, error: null })
      } else {
        set({ error: 'Failed to fetch cart' })
      }
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  addToCart: async (productId) => {
    set({ loading: true })
    try {
      const response = await post(`/product_cart/add/${productId}.json`)
      if (response.ok) {
        const data = await response.json
        set({ cart: data.cart, error: null })
      } else {
        set({ error: 'Failed to add item to cart' })
      }
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  removeFromCart: async (productId) => {
    set({ loading: true })
    try {
      const response = await destroy(`/product_cart/remove/${productId}.json`)
      if (response.ok) {
        const data = await response.json
        set({ cart: data.cart, error: null })
      } else {
        set({ error: 'Failed to remove item from cart' })
      }
    } catch (error) {
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null })
}))

export default useCartStore
