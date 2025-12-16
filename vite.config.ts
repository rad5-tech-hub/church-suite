/// <reference types="vitest" />  // ✅ Enables Vitest types

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
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
            src: '/churchset.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/churchset.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg}'],
      },
      devOptions: {
      enabled: true,  // Enables the PWA in development
      type: "module"      },
    }),
  ],

  // ✅ Vitest setup added here
  test: {
    environment: "jsdom",        // Simulates the browser
    globals: true,               // Allows using `describe`, `it`, `expect` without imports
    setupFiles: "./setupTests.ts", // Like Jest setup file
  },
});
