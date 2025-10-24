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
        name: 'Churchset – A Church Management',
        short_name: 'Churchset',
        description: 'Churchset – Modern Solution for Church Management',
        theme_color: '#F6F4FE',
        background_color: '#1C183B',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/churchset.png', // ✅ Correct path for public folder asset
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/churchset.png', // You can duplicate or add different sizes later
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable', // ✅ Optional, good for Android install
          },
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
