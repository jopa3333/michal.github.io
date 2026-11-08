import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/michal.github.io/' : './',
  root: 'src',
  publicDir: '../public',
  plugins: [react()],
  build: {
    // Output goes to <repo>/dist, which the deploy-pages workflow uploads.
    outDir: '../dist',
    emptyOutDir: true
  }
}));
