import React from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './components/AppRouter'

// Create a function to initialize the React app
const initReactApp = () => {
  const container = document.getElementById('react-root')
  if (container) {
    const root = createRoot(container)
    root.render(
      <React.StrictMode>
        <AppRouter />
      </React.StrictMode>
    )
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initReactApp)

// Re-initialize when Turbo navigates
// document.addEventListener('turbo:load', initReactApp)
