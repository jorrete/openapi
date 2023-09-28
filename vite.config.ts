/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vite';

// import { server } from './server';
//
// function serverPlugin() {
//   return {
//     config(_, {
//       command,
//     }) {
//       if (command === 'serve') {
//         server();
//       }
//     },
//     name: 'openapi:server',
//   };
// }

export default defineConfig({
  resolve: {
    alias: {
      'utils': path.join(process.cwd(), 'utils'),
    },
  },
  root: 'example',
  server: {
    host: '0.0.0.0',
    port: 7778,
  },
});
