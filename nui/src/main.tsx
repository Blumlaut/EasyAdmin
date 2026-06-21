import React from 'react'
import ReactDOM from 'react-dom/client'
import * as CfxThree from '@citizenfx/three'
import App from './App'
import './styles/index.css'
import './components/chart-setup'

// Expose Three.js (CitizenFX build with CfxTexture) as globals for screenshot/stream capture.
// These are consumed by lib/screenshot.ts and lib/stream_webrtc.ts at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).THREE = CfxThree
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).CfxTexture = CfxThree.CfxTexture

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
