import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@livekit/components-styles'
import './index.css'
import App from './App.jsx'

// Seed data is now handled by the Spring Boot backend (DataSeeder.java)
// No local seed needed when connected to backend

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
