import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // FIXED: prompt is more reliable than autoUpdate for single-tab PWAs.
      // autoUpdate silently downloads the new SW but won't activate it until
      // ALL tabs are closed — so a refresh alone never picks it up.
      // With this config we call skipWaiting() ourselves immediately.
      registerType: "prompt",

      devOptions: {
        enabled: true
      },

      manifest: {
        name: "HaveIRidden? — Transit Tracker",
        short_name: "HaveIRidden",
        description: "Track NYC Subway rides and DC Metro stations you've visited.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png",    sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png",    sizes: "512x512", type: "image/png" },
          { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },

      workbox: {
        // Cache all app assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],

        // FIXED: skipWaiting + clientsClaim so the new SW takes over
        // immediately on install rather than waiting for tab close.
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          {
            // datasets.json: StaleWhileRevalidate — serve cache instantly,
            // update in background. Perfect for underground use.
            urlPattern: /\/data\/datasets\.json/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "transit-data-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      }
    })
  ]
})