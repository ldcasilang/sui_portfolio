import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This is required for Vercel
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'sui-vendor': ['@mysten/dapp-kit', '@mysten/sui/transactions'],
          'ui-vendor': ['react-toastify']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  // Optimize for faster builds
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mysten/dapp-kit']
  }
})