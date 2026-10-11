import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Su GitHub Pages il sito vive in /<nome-repo>/: il workflow passa BASE_PATH.
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? '/',
  server: { port: 8090 },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@tensorflow')) return 'tfjs'
          return undefined
        },
      },
    },
  },
})
