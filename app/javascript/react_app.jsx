import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { useThemeStore } from './stores/theme'
import useAuthStore from './stores/authStore'

function App() {
  const { isDarkMode } = useThemeStore()
  const { initAuth } = useAuthStore()

  useEffect(() => {
    document.querySelector('body').classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    // Only fetch if we don't have the data from the window object
    initAuth()
  }, [])

  return (
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  )
}

// Create a function to initialize the React app
const initReactApp = () => {
  const container = document.getElementById('react-root')
  if (container) {
    const root = createRoot(container)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initReactApp)

// Export the initialization function for use in other contexts if needed
export { initReactApp }
