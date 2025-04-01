import { create } from 'zustand'

export const useCableStore = create((set) => ({
  cable: null,
  subscriptions: {},
  setCable: (cable) => set({ cable }),
  setSubscription: (channel, subscription) => 
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [channel]: subscription
      }
    })),
  removeSubscription: (channel) =>
    set((state) => {
      const { [channel]: _, ...rest } = state.subscriptions
      return { subscriptions: rest }
    }),
  reset: () => set({ cable: null, subscriptions: {} })
}))
