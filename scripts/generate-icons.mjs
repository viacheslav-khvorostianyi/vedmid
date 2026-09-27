// Renders PWA / touch icons from public/bear.svg. Run: node scripts/generate-icons.mjs
// Needs Playwright's Chromium (npx playwright install chromium).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const BG = '#383838';
const svg = await readFile(new URL('../public/bear.svg', import.meta.url), 'utf8');

// size: output px; bearWidth: share of the canvas the bear spans (maskable must stay inside the 80% safe zone)
const ICONS = [
  { file: 'icon-192.png', size: 192, bearWidth: 0.78 },
  { file: 'icon-512.png', size: 512, bearWidth: 0.78 },
  { file: 'maskable-512.png', size: 512, bearWidth: 0.6 },
  { file: 'apple-touch-icon.png', size: 180, bearWidth: 0.72 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, bearWidth } of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${BG}">
       <div style="width:${Math.round(size * bearWidth)}px">${svg.replace('<svg ', '<svg width="100%" ')}</div>
     </body>`,
  );
  await page.screenshot({ path: new URL(`../public/icons/${file}`, import.meta.url).pathname });
  console.log('wrote public/icons/' + file);
}
await browser.close();
