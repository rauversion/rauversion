import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { useThemeStore } from './stores/theme'
import useAuthStore from './stores/authStore'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { isDarkMode } = useThemeStore()
  const { initAuth } = useAuthStore()

  useEffect(() => {
    document.querySelector('body').classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    initAuth()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

let root = null

const initReactApp = () => {
  const container = document.getElementById('react-root')
  if (container && !root) {
    root = createRoot(container)
    root.render(<App />)
  }
}

export { initReactApp }
