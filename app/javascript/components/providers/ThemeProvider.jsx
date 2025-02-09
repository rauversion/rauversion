import React, { useEffect } from 'react'
import { useThemeStore } from '../../stores/theme'

export function ThemeProvider({ children }) {
  const { isDarkMode } = useThemeStore()

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const storedTheme = localStorage.getItem('theme-storage')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (storedTheme) {
      const { state } = JSON.parse(storedTheme)
      document.documentElement.classList.toggle('dark', state.isDarkMode)
    } else {
      document.documentElement.classList.toggle('dark', systemPrefersDark)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  return children
}
