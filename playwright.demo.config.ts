import { defineConfig, devices } from '@playwright/test';

// Smoke test for the static demo build as GitHub Pages serves it (under /vedmid/).
// Run with `npm run test:demo`, which builds dist-demo first.
const PORT = 4174;
export const DEMO_BASE = '/vedmid/';

export default defineConfig({
  testDir: './e2e-demo',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npx vite preview --mode demo --base ${DEMO_BASE} --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${DEMO_BASE}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
