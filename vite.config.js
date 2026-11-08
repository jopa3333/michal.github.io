import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'github' ? '/michal.github.io/' : './',
  root: 'src',
  publicDir: '../public',
  plugins: [react()],
  build: {
    // GitHub Pages is configured to publish the repository root.
    outDir: '..',
    emptyOutDir: false
  }
}));
