// app entry point: mount the React app into the DOM
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/*
 * - StrictMode helps highlight potential problems during development
 * - deprecated APIs, unsafe lifecycles, etc.
 * - does not affect production
*/
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
