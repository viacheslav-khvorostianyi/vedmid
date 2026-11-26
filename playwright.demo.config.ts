import { defineConfig, devices } from '@playwright/test';

// Smoke test for the demo build as GitHub Pages serves it (under /vedmid/).
// - `npm run test:demo` builds dist-demo and serves it locally.
// - With DEMO_ORIGIN set (e.g. https://viacheslav-khvorostianyi.github.io) it tests the live site instead;
//   some problems (Safari's mixed-content blocking) only appear over https.
const PORT = 4174;
export const DEMO_BASE = '/vedmid/';
const live = process.env.DEMO_ORIGIN;

export default defineConfig({
  testDir: './e2e-demo',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // A first visit installs the mock service worker and parses ~1.4 MB of JS before the app renders. Alone that takes
  // 1–2 s, but with three browsers starting in parallel WebKit measured up to ~5 s, the default limit.
  expect: { timeout: 15_000 },
  use: { baseURL: live ?? `http://localhost:${PORT}`, trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: live
    ? undefined
    : {
        command: `npx vite preview --mode demo --base ${DEMO_BASE} --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}${DEMO_BASE}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
