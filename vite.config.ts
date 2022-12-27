/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';
import server from './server';

function serverPlugin() {
  return {
    name: 'openapi:server',
    config(_, { command }) {
      if (command === 'server') {
        server();
      }
    },
  };
}

export default defineConfig({
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
    serverPlugin(),
  ],
  test: {
    root: 'src',
    dir: 'src',
    include: ['**/test.*'],
    environment: 'jsdom',
  },
});
