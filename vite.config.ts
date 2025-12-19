import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/parallel': {
        target: 'https://api.parallel.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/parallel/, ''),
        headers: {
          'Origin': 'https://api.parallel.ai'
        }
      },
      '/api/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ''),
      }
    }
  }
})
