import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same as the nginx /api proxy in compose, so `VITE_API_MODE=http npm run dev` works
    // against a local app server without CORS.
    proxy: {
      '/api': {
        target: process.env.APP_SERVER_URL ?? 'http://localhost:8081',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
