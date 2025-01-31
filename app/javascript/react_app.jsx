import React, {useEffect} from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter'
import { ThemeProvider } from './components/providers/ThemeProvider'
import { useThemeStore } from './stores/theme'

function App() {
  const { isDarkMode } = useThemeStore()

  useEffect(() => {
    document.querySelector('body').classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

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
