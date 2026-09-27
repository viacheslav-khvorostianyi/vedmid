import { expect, SUPABASE, test } from './fixtures';

test('mobile: flip, answer with a button and with a swipe; answers reach the server', async ({
  asWaiter: page,
  isMobile,
}) => {
  test.skip(!isMobile, 'mobile layout');
  const answers: unknown[] = [];
  await page.route(`${SUPABASE}/rest/v1/rpc/record_answer`, async (route) => {
    answers.push(route.request().postDataJSON());
    await route.fulfill({ json: [{ xp: 5, level: 1, streak: 1, max_streak: 1, new_achievements: [] }] });
  });
  await page.goto('/cards');
  await expect(page.getByText('картка 1 з 59')).toBeVisible();

  const card = page.getByRole('button', { name: /торкнись для детального ознайомлення/ });
  await card.click();
  await expect(page.getByRole('button', { pressed: true })).toBeVisible();
  await page.getByRole('button', { name: 'знаю', exact: true }).click();
  await expect(page.getByText('картка 2 з 59')).toBeVisible();

  const box = (await page.getByRole('button', { pressed: false }).first().boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 150, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByText('картка 3 з 59')).toBeVisible();

  await expect.poll(() => answers.length).toBe(2);
  expect(answers).toEqual([
    expect.objectContaining({ p_correct: true, p_source: 'card' }),
    expect.objectContaining({ p_correct: false, p_source: 'card' }),
  ]);
});

test('desktop: Space reveals, arrows answer', async ({ asWaiter: page, isMobile }) => {
  test.skip(isMobile, 'desktop layout');
  await page.goto('/cards?c=spirits');
  await expect(page.getByText('картка 1 з 27')).toBeVisible();
  await expect(page.getByRole('button', { name: /показати відповідь/ })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /показати відповідь/ })).toBeHidden();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('картка 2 з 27')).toBeVisible();
  const panel = page.getByRole('region', { name: 'прогрес колоди' });
  await expect(panel.getByText('нові').locator('xpath=following-sibling::span')).toHaveText('26');
});
