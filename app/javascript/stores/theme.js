import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const getInitialTheme = () => {
  // Check if theme was previously stored
  const storedTheme = localStorage.getItem('theme-storage')
  if (storedTheme) {
    const { state } = JSON.parse(storedTheme)
    return state.isDarkMode
  }
  
  // If no stored theme, check system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
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

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const { setDarkMode } = useThemeStore.getState()
      setDarkMode(e.matches)
    })
}
