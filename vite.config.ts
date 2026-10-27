import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // bind to all interfaces so Docker can expose the port
    proxy: {
      // Proxy all /api requests to the API gateway.
      // In Docker: set API_GATEWAY_URL=http://api-gateway:3000 (container name).
      // In local dev: defaults to http://localhost:3000.
      '/api': {
        target: process.env['API_GATEWAY_URL'] || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          hls: ['hls.js'],
        },
      },
    },
  },
});
