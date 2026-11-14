import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'ZenTime',
        short_name: 'ZenTime',
        description: 'Offline-first Pomodoro timer, tasks, streaks and analytics.',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
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