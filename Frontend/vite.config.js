import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      manifest: {
        name: 'Tempos — Control Horario',
        short_name: 'Tempos',
        description: 'Software de control horario legal para empresas y autónomos en España.',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        globIgnores: ['**/*.jpg', '**/*.png', '**/marketing/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const rawPath = id.split('node_modules/')[1];
          if (!rawPath) return;
          const parts = rawPath.split('/');
          const packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

          if (packageName === 'react-router-dom') return 'vendor-router';
          if (packageName === 'recharts') return 'vendor-recharts';
          if (packageName === 'firebase') return 'vendor-firebase';
          if (packageName === 'scheduler') return 'vendor-react';
          if (packageName === 'react' || packageName === 'react-dom') return 'vendor-react';
          if (packageName.startsWith('@capacitor')) return 'vendor-capacitor';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/status': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
