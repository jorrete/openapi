/// <reference types="vitest" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
  root: 'htdocs',
  resolve: {
    alias: {
      'utils': path.join(process.cwd(), 'utils'),
    },
  },
  server: {
    port: 7777,
    host: '0.0.0.0',
  },
  plugins: [
    preact({
      include: [/\.tsx$/],
    }),
  ],
  test: {
    include: ['**/test.*'],
    globals: true,
    // environment: 'jsdom',
  },
});
