import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // tsconfig usa `jsx: preserve` per Next.js: nei test i componenti .tsx
  // vanno trasformati qui. Riguarda solo vitest, non la build.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
