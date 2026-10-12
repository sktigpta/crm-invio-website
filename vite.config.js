import { readFileSync } from 'node:fs';
import process from 'node:process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const APP_VERSION = packageJson.version || '1.0.2';

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
  },
  base: '/',
  server: {
    port: 7496,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PORT
          ? `http://localhost:${process.env.VITE_BACKEND_PORT}`
          : process.env.BACKEND_PORT
            ? `http://localhost:${process.env.BACKEND_PORT}`
            : 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 7496,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
