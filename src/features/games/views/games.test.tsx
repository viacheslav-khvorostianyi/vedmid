import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Database } from '@/lib/db.types';
import { callOrQueue, type RpcResult } from '@/lib/rpc';
import { setViewportWidth } from '@/test/matchMedia';
import { MENU } from '@/test/menuFixture';
import { GUEST_SCENARIOS, renderRoute } from '@/test/renderRoute';
import { splitIngredients } from '../engines/recipe';
import { QUIZ_SECONDS } from '../engines/quiz';

type Rows = Database['public']['Functions']['record_answer']['Returns'];

vi.mock('@/lib/rpc', () => ({
  callOrQueue: vi.fn(),
  flushPendingCalls: vi.fn(async () => ({ sent: 0, dropped: 0, remaining: 0 })),
}));
const rpc = vi.mocked(callOrQueue);

let xp = 0;
beforeEach(() => {
  xp = 0;
  rpc.mockReset();
  rpc.mockImplementation(async (fn, args): Promise<RpcResult<Rows>> => {
    if (fn === 'finish_game') return { status: 'done', data: undefined as never };
    const correct = (args as { p_correct: boolean }).p_correct;
    xp += correct ? 10 : 0;
    return {
      status: 'done',
      data: [{ xp, level: 1, streak: correct ? 1 : 0, max_streak: 1, new_achievements: [] }],
    };
  });
});

const answerCalls = () =>
  rpc.mock.calls.filter(([fn]) => fn === 'record_answer').map(([, a]) => a as Record<string, unknown>);
const finishCall = () => rpc.mock.calls.find(([fn]) => fn === 'finish_game')?.[1];

/** The correct answer for a quiz prompt, from the real menu. */
function quizAnswer(prompt: string): string {
  const title = /складу «(.+)»\?$/.exec(prompt)?.[1];
  if (title) return MENU.items.find((i) => i.title === title)!.ingredients;
  const anchor = /«якір»: «(.+)»\?$/.exec(prompt)![1];
  return MENU.items.find((i) => i.anchor === anchor)!.title;
}
const prompt = () => screen.getByText(/^(Що входить до складу|Яка позиція меню має)/).textContent!;
const options = () => screen.getAllByRole('button').filter((b) => b.closest('div.flex.flex-col.gap-2\\.5'));

describe('games list', () => {
  it('mobile: four game cards under the lockup', async () => {
    renderRoute('/games');
    expect(await screen.findByRole('heading', { level: 1, name: 'ігри' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Просто ЛІС/ })).toBeInTheDocument();
    for (const name of ['вікторина', 'пари', 'рецепт', 'гість']) {
      expect(screen.getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument();
    }
  });

  it('desktop: a 2×2 grid', async () => {
    setViewportWidth(1440);
    renderRoute('/games');
    expect(await screen.findByRole('link', { name: /^гість/ })).toHaveAttribute('href', '/games/guest');
  });

  it('games run full-screen on mobile, without the bottom nav', async () => {
    renderRoute('/games/quiz');
    expect(await screen.findByRole('heading', { name: 'вікторина' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'основна навігація' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'вийти з гри' })).toHaveAttribute('href', '/games');
  });
});

describe('quiz', () => {
  it('shows timer, lives and progress; a right answer is green and recorded', async () => {
    renderRoute('/games/quiz');
    await screen.findByRole('timer');
    expect(screen.getByRole('timer')).toHaveTextContent(String(QUIZ_SECONDS));
    expect(screen.getByRole('img', { name: 'життя: 3 з 3' })).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: quizAnswer(prompt()) }));
    expect(screen.getByRole('button', { name: /— правильно$/ })).toBeDisabled();
    expect(screen.getByText('Правильно!')).toBeInTheDocument();
    expect(answerCalls()[0]).toMatchObject({ p_correct: true, p_source: 'quiz' });
    expect(screen.getByRole('button', { name: 'далі' })).toHaveFocus();
  });

  it('a wrong answer costs a life and reveals the right one; three wrong answers end the game', async () => {
    renderRoute('/games/quiz');
    await screen.findByRole('timer');
    for (let round = 0; round < 3; round++) {
      const right = quizAnswer(prompt());
      const wrong = options().find((b) => b.textContent !== right)!;
      await userEvent.click(wrong);
      expect(screen.getByRole('button', { name: /— правильна відповідь$/ })).toHaveTextContent(right);
      await userEvent.click(screen.getByRole('button', { name: round === 2 ? 'результати' : 'далі' }));
    }
    expect(screen.getByRole('heading', { name: 'вікторина: результат' })).toBeInTheDocument();
    expect(screen.getByText('0 з 10')).toBeInTheDocument();
    expect(screen.getByText('Життя закінчились — спробуй ще раз.')).toBeInTheDocument();
    expect(finishCall()).toEqual({ p_mode: 'quiz', p_score: 0, p_total: 10 });
  });

  it('running out of time counts as wrong', async () => {
    vi.useFakeTimers();
    try {
      renderRoute('/games/quiz');
      await act(async () => vi.advanceTimersByTimeAsync(50));
      await act(async () => vi.advanceTimersByTimeAsync(QUIZ_SECONDS * 1000));
      expect(screen.getByText('Час вийшов.')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'життя: 2 з 3' })).toBeInTheDocument();
      expect(answerCalls()).toEqual([expect.objectContaining({ p_correct: false, p_source: 'quiz' })]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('desktop: number keys pick an answer', async () => {
    setViewportWidth(1440);
    const { router } = renderRoute('/games/quiz');
    await screen.findByRole('timer');
    fireEvent.keyDown(window, { code: 'Digit2', key: '2' });
    expect(answerCalls()).toHaveLength(1);
    expect(options()[1]).toBeDisabled();
    // the section shortcut «2 → картки» must not fire inside a game
    expect(router.state.location.pathname).toBe('/games/quiz');
  });
});

describe('match', () => {
  const tiles = () =>
    screen
      .getAllByRole('button', { pressed: false })
      .concat(screen.queryAllByRole('button', { pressed: true }));
  const itemTiles = () =>
    tiles().filter((b) => !b.textContent!.startsWith('якір') && !(b as HTMLButtonElement).disabled);
  const anchorFor = (title: string) => {
    const anchor = MENU.items.find((i) => i.title === title)!.anchor;
    return screen.getAllByRole('button').find((b) => b.textContent === `якір${anchor}`)!;
  };

  it('pairs items with anchors, flags a wrong pair, and records both', async () => {
    renderRoute('/games/match');
    await screen.findByText('З’єднай кожну позицію з її «якорем».');
    const [first, second] = itemTiles();
    await userEvent.click(first);
    await userEvent.click(anchorFor(second.textContent!));
    expect(screen.getByText('Не пара — спробуй ще.')).toBeInTheDocument();
    expect(screen.getByText('помилок: 1')).toBeInTheDocument();
    await userEvent.click(first);
    await userEvent.click(anchorFor(first.textContent!));
    expect(first).toBeDisabled();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(answerCalls().map((a) => a.p_correct)).toEqual([false, true]);
  });

  it('finishes when all four pairs are found', async () => {
    renderRoute('/games/match');
    await screen.findByText('1/4'.replace('1', '0'));
    for (let i = 0; i < 4; i++) {
      const item = itemTiles()[0];
      const title = item.textContent!;
      await userEvent.click(item);
      await userEvent.click(anchorFor(title));
    }
    expect(screen.getByRole('heading', { name: 'пари: результат' })).toBeInTheDocument();
    expect(screen.getByText(/помилок: 0/)).toBeInTheDocument();
    expect(screen.getByText('+40 XP за цю гру')).toBeInTheDocument();
    expect(finishCall()).toEqual({ p_mode: 'match', p_score: 4, p_total: 4 });
  });
});

describe('recipe', () => {
  it('scores a perfect pick and explains mistakes; 5 rounds end with results', async () => {
    renderRoute('/games/recipe');
    await screen.findByText('Обери все, що входить до складу:');
    for (let round = 0; round < 5; round++) {
      const title = screen.getByText('Обери все, що входить до складу:').nextElementSibling!.textContent!;
      const own = splitIngredients(MENU.items.find((i) => i.title === title)!.ingredients);
      const choices = screen.getAllByRole('button', { pressed: false });
      const correct = choices.filter((b) => own.includes(b.textContent!));
      if (round === 0) {
        await userEvent.click(choices.find((b) => !own.includes(b.textContent!))!);
      } else {
        for (const b of correct) await userEvent.click(b);
      }
      await userEvent.click(screen.getByRole('button', { name: 'перевірити' }));
      expect(screen.getByText(round === 0 ? /^Не зовсім/ : 'Ідеально!')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: round === 4 ? 'результати' : 'далі' }));
    }
    expect(screen.getByText('4 з 5')).toBeInTheDocument();
    expect(answerCalls().map((a) => a.p_correct)).toEqual([false, true, true, true, true]);
    expect(finishCall()).toEqual({ p_mode: 'recipe', p_score: 4, p_total: 5 });
  });

  it('cannot check with nothing selected', async () => {
    renderRoute('/games/recipe');
    expect(await screen.findByRole('button', { name: 'перевірити' })).toBeDisabled();
  });
});

describe('guest', () => {
  it('shows the situation, explains the choice, and records it', async () => {
    renderRoute('/games/guest');
    const first = GUEST_SCENARIOS[0];
    expect(await screen.findByText(`«${first.quote}»`)).toBeInTheDocument();
    const right = first.options.find((o) => o.correct)!;
    await userEvent.click(screen.getByRole('button', { name: right.text }));
    expect(screen.getByText(right.feedback)).toBeInTheDocument();
    expect(answerCalls()[0]).toMatchObject({ p_item_id: null, p_correct: true, p_source: 'guest' });
  });

  it('plays all five scenarios to the results', async () => {
    renderRoute('/games/guest');
    for (let i = 0; i < GUEST_SCENARIOS.length; i++) {
      const s = GUEST_SCENARIOS[i];
      await screen.findByText(`«${s.quote}»`);
      const wrong = s.options.find((o) => !o.correct)!;
      await userEvent.click(screen.getByRole('button', { name: wrong.text }));
      await userEvent.click(screen.getByRole('button', { name: i === 4 ? 'результати' : 'далі' }));
    }
    expect(screen.getByText('0 з 5')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'ще раз' }));
    expect(await screen.findByText(`«${GUEST_SCENARIOS[0].quote}»`)).toBeInTheDocument();
  });

  it('says so when there are no scenarios', async () => {
    renderRoute('/games/guest', undefined, { guest: [] });
    expect(await screen.findByText(/Сценаріїв поки немає/)).toBeInTheDocument();
  });

  it('desktop: number keys pick', async () => {
    setViewportWidth(1440);
    renderRoute('/games/guest');
    await screen.findByText(`«${GUEST_SCENARIOS[0].quote}»`);
    fireEvent.keyDown(window, { code: 'Digit1', key: '1' });
    expect(answerCalls()).toHaveLength(1);
    within(document.body).getByRole('button', { name: /далі/ });
  });
});
