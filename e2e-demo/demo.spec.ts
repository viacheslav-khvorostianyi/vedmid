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

test('all 197 menu items are reachable', async ({ page, isMobile }) => {
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
  expect(total).toBe(197);
});

test('deep links work under the base path', async ({ page }) => {
  await page.goto(BASE + 'menu/item-soup-1');
  await expect(page.getByRole('heading', { name: /Борщ з пампушкою/ }).first()).toBeVisible();
});

test('flashcard progress is kept across reloads', async ({ page }) => {
  await page.goto(BASE + 'cards?c=spirits');
  await expect(page.getByText('картка 1 з 27')).toBeVisible();
  await page.getByRole('button', { name: 'знаю', exact: true }).click();
  await expect(page.getByText('картка 2 з 27')).toBeVisible();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.getByText('картка 1 з 26')).toBeVisible();
});

test('the demo bar switches to the manager role', async ({ page }) => {
  await page.goto(BASE + 'menu');
  await page.getByRole('button', { name: /^демо/ }).click();
  await page.getByRole('button', { name: 'менеджер' }).click();
  await expect(page.getByRole('button', { name: /^демо · менеджер/ })).toBeVisible();
});
