import { create } from "zustand"

const useTrackVideoSidebarStore = create((set) => ({
  isOpen: false,
  isExpanded: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, isExpanded: false }),
  expand: () => set({ isOpen: true, isExpanded: true }),
  collapseWidth: () => set({ isExpanded: false }),
  toggleExpanded: () => set((state) => ({
    isOpen: true,
    isExpanded: !state.isExpanded,
  })),
}))

export default useTrackVideoSidebarStore
