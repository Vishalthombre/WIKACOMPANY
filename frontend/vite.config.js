import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Allows testing PWA in local development!
      },
      manifest: {
        name: 'WIKA Maintenance System',
        short_name: 'WikaMaint',
        description: 'WIKA Facility Management Application',
        theme_color: '#003399',
        background_color: '#f4f6f8',
        display: 'standalone',
        start_url: '/',
        icons: [
            {
                src: 'logo192.png', // Ensure these exist in /public
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: 'logo512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
      } 
    })
  ]
});