import { expect, test } from './fixtures';

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile layout');

  test('browse a category, open an item, read its tabs', async ({ asWaiter: page }) => {
    await page.goto('/menu');
    await page.getByRole('tab', { name: 'вино' }).click();
    await expect(page).toHaveURL(/\?c=wine$/);
    await page
      .getByRole('link', { name: /El Capitan Brut\b/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('El Capitan');
    await page.getByRole('tab', { name: 'профіль' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('Кислотність');
  });

  test('back from an item restores the list scroll position', async ({ asWaiter: page }) => {
    await page.goto('/menu');
    const target = page.getByRole('link', { name: /Бограч/ });
    await target.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(500);
    await target.click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Бограч');
    await page.getByRole('button', { name: /назад/ }).click();
    await expect(target).toBeVisible();
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(80);
  });

  test('search finds allergens across the menu', async ({ asWaiter: page }) => {
    await page.goto('/menu');
    await page.getByRole('searchbox').fill('горіхи');
    await expect(page.getByText(/^знайдено: \d+$/)).toBeVisible();
    await page.getByRole('link').filter({ hasText: /\S/ }).first().click();
    await page.getByRole('tab', { name: 'алергени' }).click();
    await expect(page.getByRole('tabpanel')).toContainText('горіхи');
  });
});

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop layout');

  test('three panes: subcategory → item → details, with the keyboard', async ({ asWaiter: page }) => {
    await page.goto('/menu');
    await page.getByRole('button', { name: /Перші страви/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('перші страви');
    await page.keyboard.press('ArrowDown');
    await expect(page).toHaveURL(/\/menu\/item-soup-1/);
    const pane = page.getByRole('complementary', { name: 'деталі позиції' });
    await expect(pane.getByRole('heading', { level: 2 })).toContainText('Борщ з пампушкою');
    await expect(pane.getByText('глютен, лактоза')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(pane.getByRole('heading', { level: 2 })).not.toContainText('Борщ');
  });

  test('/ focuses search, Esc clears it', async ({ asWaiter: page }) => {
    await page.goto('/menu');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('дитяче меню');
    await page.keyboard.press('/');
    await page.keyboard.type('рибa'.replace('a', 'а'));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('пошук: риба');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('дитяче меню');
  });
});
