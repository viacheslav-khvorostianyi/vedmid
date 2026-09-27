/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const MSW_WORKER = path.resolve(__dirname, 'node_modules/msw/lib/mockServiceWorker.js');

/** Demo mode only: serves (dev) or emits (build) the MSW service worker at /mockServiceWorker.js. */
function demoWorker(): Plugin {
  return {
    name: 'vedmid-demo-worker',
    configureServer(server) {
      server.middlewares.use('/mockServiceWorker.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.end(readFileSync(MSW_WORKER));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'mockServiceWorker.js', source: readFileSync(MSW_WORKER) });
    },
  };
}

export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    plugins: [react(), tailwindcss(), ...(demo ? [demoWorker()] : [])],
    // A literal, so `if (import.meta.env.VITE_DEMO === 'true')` folds away in normal builds.
    define: {
      'import.meta.env.VITE_DEMO': JSON.stringify(demo ? 'true' : 'false'),
      ...(demo && {
        // Never contacted: the demo service worker answers every request to this origin.
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://demo.supabase.localhost'),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('demo-anon-key'),
      }),
    },
    build: { outDir: demo ? 'dist-demo' : 'dist' },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'supabase/**/*.test.ts'],
      exclude: ['src/legacy/**', 'node_modules/**'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/legacy/**', 'src/data/**', 'src/test/**', 'src/**/*.test.{ts,tsx}'],
        // Pure engines must be fully covered (AGENTS.md rule 7).
        thresholds: {
          'src/features/flashcards/leitner.ts': {
            lines: 100,
            branches: 100,
            functions: 100,
            statements: 100,
          },
          'src/features/flashcards/session.ts': {
            lines: 100,
            branches: 100,
            functions: 100,
            statements: 100,
          },
          'src/features/games/engines/*.ts': { lines: 100, branches: 100, functions: 100, statements: 100 },
        },
      },
      env: {
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      },
    },
  };
});
