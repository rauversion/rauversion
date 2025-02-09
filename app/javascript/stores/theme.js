import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getInitialTheme = () => {
  // Check if theme was previously stored
  const storedTheme = localStorage.getItem('theme-storage')
  if (storedTheme) {
    const { state } = JSON.parse(storedTheme)
    return state.isDarkMode
  }
  
  // Default to dark mode
  return true
}

export const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: getInitialTheme(),
      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),
      setDarkMode: (isDark) =>
        set({ isDarkMode: isDark }),
    }),
    {
      name: 'theme-storage',
    }
  )
)
