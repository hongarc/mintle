import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import CSS files for components
import './components/GameBoard.css'
import './components/GuessInput.css'
import './components/Keyboard.css'
import './components/Header.css'
import './components/ResultModal.css'
import './components/Toast.css'
import './components/ErrorBoundary.css'
import './components/LoadingSpinner.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
