import { create } from 'zustand'
import { get as apiGet, post, destroy } from '@rails/request.js'
import { toast } from "@/hooks/use-toast"

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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch cart"
        })
      }
    } catch (error) {
      set({ error: error.message })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
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
        toast({
          title: "Added to Cart",
          description: "Item successfully added to your cart"
        })
      } else {
        set({ error: 'Failed to add item to cart' })
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add item to cart"
        })
      }
    } catch (error) {
      set({ error: error.message })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
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
        toast({
          title: "Removed from Cart",
          description: "Item successfully removed from your cart"
        })
      } else {
        set({ error: 'Failed to remove item from cart' })
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove item from cart"
        })
      }
    } catch (error) {
      set({ error: error.message })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } finally {
      set({ loading: false })
    }
  },

  checkout: async () => {
    set({ loading: true })
    try {
      const response = await post('/product_checkout.json')
      if (response.ok) {
        const data = await response.json
        if (data.checkout_url) {
          window.location.href = data.checkout_url
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        set({ error: 'Failed to create checkout session' })
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create checkout session"
        })
      }
    } catch (error) {
      set({ error: error.message })
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => set({ error: null })
}))

export default useCartStore
