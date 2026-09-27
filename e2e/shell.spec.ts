import { expect, test } from './fixtures';

test('opens on the menu inside the layout for this project', async ({ asWaiter: page }, testInfo) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/menu$/);
  const shell = testInfo.project.name === 'desktop' ? 'desktop' : 'mobile';
  await expect(page.locator(`[data-shell="${shell}"]`)).toBeVisible();
});

test('navigates between the four sections', async ({ asWaiter: page }) => {
  await page.goto('/menu');
  const nav = page.getByRole('navigation', { name: 'основна навігація' });
  for (const [label, path] of [
    ['картки', '/cards'],
    ['ігри', '/games'],
    ['профіль', '/profile'],
    ['меню', '/menu'],
  ]) {
    await nav.getByRole('link', { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    if (label !== 'меню') await expect(page.getByRole('heading', { level: 1 })).toHaveText(label);
  }
});

test('deep link to an item survives a reload (SPA fallback)', async ({ asWaiter: page }) => {
  await page.goto('/menu/item-soup-1');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Борщ з пампушкою/ })).toBeVisible();
});

test('resizing across 1024px swaps the shell and keeps the route', async ({ asWaiter: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'resize check runs once, in the desktop project');
  await page.goto('/games/quiz');
  await expect(page.locator('[data-shell="desktop"]')).toBeVisible();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(page.locator('[data-shell="mobile"]')).toBeVisible();
  await expect(page).toHaveURL(/\/games\/quiz$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('вікторина');
});
