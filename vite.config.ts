import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared/src'),
    },
    dedupe: [
      'react', 'react-dom',
      '@emotion/react', '@emotion/styled', '@emotion/cache',
      '@mui/material', '@mui/system', '@mui/styled-engine',
      '@mui/x-date-pickers',
    ],
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react/jsx-runtime',
      '@emotion/react', '@emotion/styled', '@emotion/cache',
      '@mui/material', '@mui/system',
    ],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
});
