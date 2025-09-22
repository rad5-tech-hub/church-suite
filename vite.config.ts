import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: "/", // 👈 ensures correct absolute paths for assets
  plugins: [react(), tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'ChurchSuite PWA',
        short_name: 'ChurchSuite',
        description: 'ChurchSuite, church management system',
        theme_color: '#111827',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: './churchsuite.png',
            sizes: '192x192',
            type: 'image/png',
          }  
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
 
})
