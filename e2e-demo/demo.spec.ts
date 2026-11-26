import { expect, test } from '@playwright/test';

const BASE = '/vedmid/';

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
  // Reload as soon as the server (the demo backend) has the answer, whether or not the app's offline copy has
  // caught up: progress restored from an earlier page load is re-checked before the deck is built.
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          Object.keys(
            (JSON.parse(localStorage.getItem('vedmid-demo:state') ?? '{}') as { progress?: object })
              .progress ?? {},
          ).length,
      ),
    )
    .toBe(1);
  await page.reload();
  await expect(page.getByText('картка 1 з 28')).toBeVisible();
});

test('the demo bar switches to the manager role', async ({ page }) => {
  await page.goto(BASE + 'menu');
  await page.getByRole('button', { name: /^демо/ }).click();
  await page.getByRole('button', { name: 'менеджер' }).click();
  await expect(page.getByRole('button', { name: /^демо · менеджер/ })).toBeVisible();
});
