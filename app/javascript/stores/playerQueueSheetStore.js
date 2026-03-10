import { create } from "zustand"

const usePlayerQueueSheetStore = create((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}))

export default usePlayerQueueSheetStore
