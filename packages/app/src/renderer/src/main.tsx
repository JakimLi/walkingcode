/** Renderer entry — mounts the React app. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.js'
import { ThemeProvider } from './theme.js'
import './styles.css'

const container = document.getElementById('root')
if (!container) throw new Error('#root not found')
createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)
