import React, { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppRouter from './components/AppRouter'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { useThemeStore } from './stores/theme'
import useAuthStore from '@/stores/authStore'
import ErrorBoundary from './components/ErrorBoundary'
import { useLocaleStore } from "@/stores/locales"

const queryClient = new QueryClient()

function App() {
  const { isDarkMode } = useThemeStore()
  const { initAuth } = useAuthStore()
  const { currentLocale} = useLocaleStore()

  useEffect(() => {
    document.querySelector('body').classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    initAuth()
  }, [])

  useEffect(() => {
   console.info('Locale Changed, submit backend request to update user locale')
  }, [currentLocale])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </QueryClientProvider>
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
