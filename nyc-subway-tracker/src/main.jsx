import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// FIXED: when the new service worker activates (skipWaiting fires and it
// claims this client), reload the page so the fresh JS bundle is served.
// Without this, the SW swaps underneath you but the old JS keeps running.
registerSW({
  onNeedRefresh() {
    // New SW is waiting — with skipWaiting: true it will self-activate,
    // but we also trigger a reload here to be explicit.
  },
  onOfflineReady() {
    console.log('[PWA] App ready for offline use')
  },
  onRegisteredSW(swUrl, registration) {
    // When the SW controlling this page changes (new SW activated via
    // skipWaiting + clientsClaim), reload to pick up the new bundle.
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          // 'activated' means the new SW is now in control
          if (newWorker.state === 'activated') {
            window.location.reload()
          }
        })
      })
    }
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)