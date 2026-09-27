import { expect, SUPABASE, test } from './fixtures';

test('signed-out visitors land on the login screen and keep their target', async ({ signedOut: page }) => {
  await page.goto('/cards');
  await expect(page).toHaveURL(/\/login\?next=%2Fcards$/);
  await expect(page.getByLabel('робоча пошта')).toBeVisible();
});

test('sending a magic link shows the confirmation and the code field', async ({ signedOut: page }) => {
  let body: { email?: string; create_user?: boolean } = {};
  await page.route(`${SUPABASE}/auth/v1/otp*`, async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: {} });
  });
  await page.goto('/login?next=%2Fgames');
  await page.getByLabel('робоча пошта').fill('olena@prostolis.ua');
  await page.getByRole('button', { name: 'надіслати посилання' }).click();
  await expect(page.getByText('Посилання для входу надіслано на')).toBeVisible();
  await expect(page.getByLabel('або введи 6-значний код з листа')).toBeVisible();
  expect(body).toMatchObject({ email: 'olena@prostolis.ua', create_user: false });
});

test('an email that is not on the staff list gets a clear explanation', async ({ signedOut: page }) => {
  await page.route(`${SUPABASE}/auth/v1/otp*`, (route) =>
    route.fulfill({ status: 422, json: { code: 'otp_disabled', message: 'Signups not allowed for otp' } }),
  );
  await page.goto('/login');
  await page.getByLabel('робоча пошта').fill('stranger@gmail.com');
  await page.getByRole('button', { name: 'надіслати посилання' }).click();
  await expect(page.getByRole('alert')).toContainText('Цієї пошти немає в списку персоналу');
});

test('waiters are kept out of the manager screen', async ({ asWaiter: page }) => {
  await page.goto('/manager');
  await expect(page).toHaveURL(/\/menu$/);
});

test('managers see their tools on desktop', async ({ asManager: page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'manager tools are desktop-only');
  await page.goto('/menu');
  await expect(page.getByText('Ірина Мельник')).toBeVisible();
  await page.getByRole('link', { name: /керування меню/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('керування меню');
});

test('the offline banner appears after 2 s without a connection', async ({ asWaiter: page, context }) => {
  await page.goto('/menu');
  await expect(page.getByRole('searchbox')).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText('офлайн — показуємо збережене меню')).toBeVisible({ timeout: 5000 });
  await context.setOffline(false);
  await expect(page.getByText('офлайн — показуємо збережене меню')).toBeHidden();
});
