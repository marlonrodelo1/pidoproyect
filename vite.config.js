import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // Sube un poco el límite para evitar el warning sin descontrolar el tamaño
    chunkSizeWarningLimit: 1000, // kB
    rollupOptions: {
      output: {
        manualChunks: {
          // React y router en un chunk de vendor principal
          reactVendor: ['react', 'react-dom', 'react-router-dom'],
          // Material UI y Emotion en otro chunk
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Leaflet en un chunk separado (solo se usa en el mapa)
          leaflet: ['leaflet'],
          // Supabase en su propio chunk
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
})
