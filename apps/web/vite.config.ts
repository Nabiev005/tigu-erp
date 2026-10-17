/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The single .env lives in the repository root.
const envDir = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const apiTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000';

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.WEB_PORT ?? 5173),
      proxy: {
        '/api': apiTarget,
        '/health': apiTarget,
        '/ready': apiTarget,
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Absolute API base so MSW (node) can intercept fetch.
      env: { VITE_API_URL: 'http://localhost', VITE_API_MOCKS: 'false' },
    },
  };
});
