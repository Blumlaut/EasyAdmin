import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import './components/chart-setup'

// Load mock FiveM environment when ?dev is in the URL
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev')) {
  await import('./mock')
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
