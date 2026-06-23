import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import './components/chart-setup'
// Register all installed NUI plugins (side-effect import).
import './plugins/manifest'

// Three.js (@citizenfx/three) is in a separate chunk (dynamic import).
// Pre-load it in the background so the screenshot/stream render loop
// is ready by the time ScreenshotCapture mounts. CfxTexture requires
// a warm, continuously-running WebGL pipeline — any gap means black frames.
//
// Top-level const + import() ensures Vite emits <link rel="modulepreload"> tags
// so the three.module chunk downloads in parallel with the main bundle.
const _preloadThree = import('./lib/three-loader')
_preloadThree.then(({ loadThree }) => loadThree()).catch(() => {})

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
