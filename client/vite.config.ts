import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev'de /api istekleri backend'e (4000) yonlendirilir.
// Prod'da Express ayni origin'den hem API hem build'i servis eder.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
