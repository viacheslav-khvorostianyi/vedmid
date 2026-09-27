import { guestScenarios } from '../supabase/seed/guestScenarios';
import { expect, SUPABASE, test } from './fixtures';

test('guest game: answers and the final result reach the server', async ({ asWaiter: page }) => {
  const calls: { fn: string; body: Record<string, unknown> }[] = [];
  await page.route(`${SUPABASE}/rest/v1/rpc/*`, async (route) => {
    calls.push({ fn: route.request().url().split('/').pop()!, body: route.request().postDataJSON() });
    await route.fulfill({ json: [{ xp: 20, level: 1, streak: 1, max_streak: 1, new_achievements: [] }] });
  });
  await page.goto('/games');
  await page.getByRole('link', { name: /^гість/ }).click();
  for (const [i, s] of guestScenarios.entries()) {
    await expect(page.getByText(`«${s.quote}»`)).toBeVisible();
    const right = s.options.find((o) => o.isCorrect)!;
    await page.getByRole('button', { name: right.text }).click();
    await expect(page.getByText(right.feedback)).toBeVisible();
    await page.getByRole('button', { name: i === guestScenarios.length - 1 ? 'результати' : 'далі' }).click();
  }
  await expect(page.getByText('5 з 5')).toBeVisible();
  await expect.poll(() => calls.filter((c) => c.fn === 'record_answer').length).toBe(5);
  await expect
    .poll(() => calls.find((c) => c.fn === 'finish_game')?.body)
    .toEqual({ p_mode: 'guest', p_score: 5, p_total: 5 });
});

test('quiz: mobile hides the bottom nav; desktop answers with number keys', async ({
  asWaiter: page,
  isMobile,
}) => {
  await page.goto('/games/quiz');
  await expect(page.getByRole('timer')).toBeVisible();
  if (isMobile) {
    await expect(page.getByRole('navigation', { name: 'основна навігація' })).toBeHidden();
    await page.getByRole('link', { name: 'вийти з гри' }).click();
    await expect(page).toHaveURL(/\/games$/);
  } else {
    await page.keyboard.press('3');
    await expect(page.getByRole('button', { name: /далі|результати/ })).toBeFocused();
    // «3» is also the section shortcut for games; inside a game it must only pick the answer
    await expect(page).toHaveURL(/\/games\/quiz$/);
    await page.keyboard.press('2');
    await expect(page).toHaveURL(/\/games\/quiz$/);
  }
});
