import { expect, test } from '@playwright/test';

const BASE = '/vedmid/';

/** Card answers in the app's persisted query cache (IndexedDB vedmid-cache/queries, see src/lib/queryClient.ts). */
async function savedCardAnswers(): Promise<number> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const open = indexedDB.open('vedmid-cache');
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  if (!db.objectStoreNames.contains('queries')) return 0;
  const raw = await new Promise<unknown>((resolve) => {
    const req = db.transaction('queries').objectStore('queries').get('vedmid-query-cache');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(undefined);
  });
  db.close();
  if (typeof raw !== 'string') return 0;
  const cache = JSON.parse(raw) as {
    clientState?: { queries?: { queryKey: unknown[]; state: { data: unknown } }[] };
  };
  const progress = cache.clientState?.queries?.find((q) => q.queryKey[0] === 'progress')?.state.data;
  return Array.isArray(progress) ? progress.length : 0;
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('first visit signs in automatically and opens the menu', async ({ page }) => {
  await page.goto(BASE);
  await expect(page).toHaveURL(/\/vedmid\/menu$/);
  await expect(page.getByRole('searchbox')).toBeVisible();
  await expect(page.getByRole('button', { name: /^демо · офіціант/ })).toBeVisible();
});

test('all 292 menu items are reachable', async ({ page, isMobile }) => {
  test.skip(isMobile, 'counted from the desktop subcategory list');
  await page.goto(BASE + 'menu');
  let total = 0;
  for (const chip of ['їжа', 'вино', 'коктейлі', 'пиво', 'міцні']) {
    await page.getByRole('tab', { name: chip }).click();
    const counts = await page
      .getByRole('navigation', { name: 'підкатегорії' })
      .locator('button span')
      .allTextContents();
    total += counts.reduce((sum, n) => sum + Number(n), 0);
  }
  expect(total).toBe(292);
});

test('dish photos load straight from the site, without the service worker', async ({ page }) => {
  await page.goto(BASE + 'menu/item-soup-1');
  const photo = page.getByRole('img', { name: /фото подачі: Борщ/ });
  await expect(photo).toHaveAttribute('src', '/vedmid/demo-photos/own/soup-1.webp');
  await expect
    .poll(() => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
});

test('deep links work under the base path', async ({ page }) => {
  await page.goto(BASE + 'menu/item-soup-1');
  await expect(page.getByRole('heading', { name: /Борщ з гречаним хлібом/ }).first()).toBeVisible();
});

test('flashcard progress is kept across reloads', async ({ page }) => {
  await page.goto(BASE + 'cards?c=spirits');
  await expect(page.getByText('картка 1 з 29')).toBeVisible();
  await page.getByRole('button', { name: 'знаю', exact: true }).click();
  await expect(page.getByText('картка 2 з 29')).toBeVisible();
  // After a reload the deck is built from the app's offline query cache, which is saved at most once a second
  // (queryPersister in src/lib/queryClient.ts). Reload only once the answer is in it, not after a fixed delay.
  await expect.poll(() => page.evaluate(savedCardAnswers), { timeout: 10_000 }).toBe(1);
  await page.reload();
  // WebKit sometimes takes several seconds to restart the demo's service worker after a reload
  await expect(page.getByText('картка 1 з 28')).toBeVisible({ timeout: 20_000 });
});

test('the demo bar switches to the manager role', async ({ page }) => {
  await page.goto(BASE + 'menu');
  await page.getByRole('button', { name: /^демо/ }).click();
  await page.getByRole('button', { name: 'менеджер' }).click();
  await expect(page.getByRole('button', { name: /^демо · менеджер/ })).toBeVisible();
});
