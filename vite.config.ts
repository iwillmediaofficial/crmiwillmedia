import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@tanstack')) return 'vendor-query'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('react')) return 'vendor-react'
          }
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})
