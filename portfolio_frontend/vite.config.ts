import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    port: 5173,
    host: true, // Allows external access
    headers: {
      // Allow Chrome extensions
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173 chrome-extension://khpkpbbcccdmmclmpigdgddabeilkdpd;"
    }
  }
})
