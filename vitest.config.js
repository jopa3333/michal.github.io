import { defineConfig } from 'vitest/config';

// Separate from vite.config.js, which sets root: 'src' for the app build.
export default defineConfig({
  root: '.',
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js'],
  },
});
