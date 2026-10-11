import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from "@sentry/vite-plugin"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Accept connections from any device on the network
    port: 5173,
    strictPort: false,
    origin: 'https://encore-trash-drew.ngrok-free.dev'
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000 kB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split large libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/sonner/') || id.includes('node_modules/framer-motion/')) {
            return 'ui-vendor';
          }
          if (id.includes('node_modules/recharts/')) {
            return 'charts-vendor';
          }
          if (id.includes('node_modules/otpauth/')) {
            return 'auth-vendor';
          }
          if (id.includes('node_modules/firebase/')) {
            return 'firebase-vendor';
          }
          // Feature chunks - group by directory
          if (id.includes('/src/pages/admin/')) {
            return 'admin';
          }
          // Don't split user/order to avoid circular dependencies
          // Let lazy loading handle page-level splitting
        }
      }
    }
  },
  plugins: [
    sentryVitePlugin({
      org: "bennycare",
      project: "bennycare",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['offline.html', 'firebase-messaging-sw.js'],
      manifest: {
        name: 'BennyCare - AETHER',
        short_name: 'BennyCare',
        description: 'Quality health and wellness products for your wellbeing',
        theme_color: '#22C55E',
        background_color: '#051510',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/chlfmkeplogbkornbwqc\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
