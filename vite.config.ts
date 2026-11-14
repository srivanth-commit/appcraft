import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/appcraft/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Zentimer',
        short_name: 'Zentimer',
        description: 'Offline Pomodoro timer with statistics',
        theme_color: '#18181b',
        background_color: '#18181b',
        display: 'standalone',
        start_url: '/appcraft/',
        scope: '/appcraft/',
        icons: [
          { src: '/appcraft/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/appcraft/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/appcraft/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/appcraft/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|woff2)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
