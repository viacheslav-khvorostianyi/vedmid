import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CardProgress } from '@/features/flashcards/leitner';
import type { Database } from '@/lib/db.types';
import { callOrQueue, type RpcResult } from '@/lib/rpc';

type RecordAnswerRows = Database['public']['Functions']['record_answer']['Returns'];
import { setViewportWidth } from '@/test/matchMedia';
import { MENU } from '@/test/menuFixture';
import { renderRoute, TEST_USER_ID } from '@/test/renderRoute';
import { progressKey } from '../hooks/useCardProgress';

vi.mock('@/lib/rpc', () => ({
  callOrQueue: vi.fn(),
  flushPendingCalls: vi.fn(async () => ({ sent: 0, dropped: 0, remaining: 0 })),
}));
const rpc = vi.mocked(callOrQueue);

const done = (
  xp = 5,
  extra: Partial<{ new_achievements: string[]; streak: number }> = {},
): RpcResult<RecordAnswerRows> => ({
  status: 'done',
  data: [{ xp, level: Math.floor(xp / 250) + 1, streak: 1, max_streak: 1, new_achievements: [], ...extra }],
});

const FOOD = MENU.items.filter((i) => i.category === 'food');
const today = new Date().toISOString();
/** All food learned today except the given items, so the deck contains only those. */
const onlyDue = (...keep: string[]): CardProgress[] =>
  FOOD.filter((i) => !keep.includes(i.id)).map((i) => ({
    itemId: i.id,
    box: 5,
    lastResult: true,
    reviewedAt: today,
  }));

const counter = () => screen.getByText(/^картка \d+ з \d+$/);

beforeEach(() => {
  rpc.mockReset();
  rpc.mockResolvedValue(done());
});

describe('CardsView (mobile)', () => {
  it('starts with the food deck as in the PDF', async () => {
    renderRoute('/cards');
    expect(await screen.findByRole('tab', { name: 'їжа' })).toHaveAttribute('aria-selected', 'true');
    expect(counter()).toHaveTextContent('картка 1 з 59');
    expect(screen.getByText('торкнись для детального ознайомлення')).toBeInTheDocument();
  });

  it('flips on tap to show the answer', async () => {
    renderRoute('/cards');
    const front = await screen.findByRole('button', { pressed: false, name: /торкнись/ });
    await userEvent.click(front);
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();
    expect(screen.getAllByText('склад').length).toBeGreaterThan(0);
  });

  it('records «знаю» on the server, moves on, and updates progress right away', async () => {
    const { client } = renderRoute('/cards', undefined, { progress: onlyDue('item-soup-1', 'item-soup-2') });
    expect(await screen.findByText('картка 1 з 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'знаю' }));
    expect(counter()).toHaveTextContent('картка 2 з 2');
    expect(rpc).toHaveBeenCalledWith(
      'record_answer',
      expect.objectContaining({ p_correct: true, p_source: 'card' }),
    );
    const answered = rpc.mock.calls[0][1] as { p_item_id: string };
    const progress = client.getQueryData<CardProgress[]>(progressKey(TEST_USER_ID))!;
    expect(progress.find((p) => p.itemId === answered.p_item_id)).toMatchObject({ box: 2, lastResult: true });
  });

  it('answers by swiping past 90px, but a short drag does nothing', async () => {
    renderRoute('/cards', undefined, { progress: onlyDue('item-soup-1', 'item-soup-2') });
    const cardButton = await screen.findByRole('button', { name: /торкнись/ });
    fireEvent.pointerDown(cardButton, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(cardButton, { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(cardButton, { clientX: 150, pointerId: 1 });
    fireEvent.click(cardButton);
    expect(counter()).toHaveTextContent('картка 1 з 2');
    expect(rpc).not.toHaveBeenCalled();
    fireEvent.pointerDown(cardButton, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(cardButton, { clientX: 60, pointerId: 1 });
    fireEvent.pointerUp(cardButton, { clientX: 60, pointerId: 1 });
    expect(counter()).toHaveTextContent('картка 2 з 2');
    expect(rpc).toHaveBeenCalledWith('record_answer', expect.objectContaining({ p_correct: false }));
  });

  it('summarises the run and offers «ще раз» and «лише помилки»', async () => {
    renderRoute('/cards', undefined, { progress: onlyDue('item-soup-1', 'item-soup-2') });
    await userEvent.click(await screen.findByRole('button', { name: 'знаю' }));
    await userEvent.click(screen.getByRole('button', { name: 'не знаю' }));
    expect(screen.getByRole('heading', { name: 'колоду пройдено' })).toBeInTheDocument();
    expect(screen.getByText('знаю 1 · повторити 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'лише помилки' }));
    expect(counter()).toHaveTextContent('картка 1 з 1');
    await userEvent.click(screen.getByRole('button', { name: 'знаю' }));
    expect(screen.getByRole('button', { name: 'лише помилки' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'ще раз' }));
    expect(counter()).toHaveTextContent('картка 1 з 1');
  });

  it('says when everything is learned for today, and can practise anyway', async () => {
    renderRoute('/cards', undefined, { progress: onlyDue() });
    expect(await screen.findByRole('heading', { name: 'на сьогодні все' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'повторити все одно' }));
    expect(counter()).toHaveTextContent('картка 1 з 59');
  });

  it('starts a new deck when the category changes', async () => {
    const { router } = renderRoute('/cards');
    await userEvent.click(await screen.findByRole('tab', { name: 'вино' }));
    expect(counter()).toHaveTextContent('картка 1 з 37');
    expect(router.state.location.search).toBe('?c=wine');
    await userEvent.click(screen.getByRole('tab', { name: 'усі' }));
    expect(counter()).toHaveTextContent('картка 1 з 197');
  });

  it('announces a new achievement and a level-up', async () => {
    rpc.mockResolvedValue(done(255, { new_achievements: ['ach-1'] }));
    renderRoute('/cards', undefined, {
      stats: { xp: 245, level: 1, streak: 0, maxStreak: 0, correctAnswers: 0, totalAnswers: 0 },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'знаю' }));
    const status = screen.getAllByRole('status').find((s) => s.textContent);
    expect(status).toHaveTextContent('Досягнення: «Стажер ЛІСу» (+50 XP)');
  });

  it('tells the user once when answers are saved for later', async () => {
    rpc.mockResolvedValue({ status: 'queued' });
    renderRoute('/cards');
    await userEvent.click(await screen.findByRole('button', { name: 'знаю' }));
    await userEvent.click(screen.getByRole('button', { name: 'знаю' }));
    expect(screen.getAllByText('Немає зв’язку: відповіді збережено, надішлемо пізніше.')).toHaveLength(1);
  });
});

describe('CardsView (desktop)', () => {
  beforeEach(() => setViewportWidth(1440));

  it('hides the answer until Space, answers with the arrows, and updates the box panel', async () => {
    renderRoute('/cards', undefined, { progress: onlyDue('item-soup-1', 'item-soup-2') });
    const reveal = await screen.findByRole('button', { name: /показати відповідь/ });
    expect(reveal).toBeInTheDocument();
    const panel = screen.getByRole('region', { name: 'прогрес колоди' });
    expect(within(panel).getByText('нові').nextElementSibling).toHaveTextContent('2');

    act(() => void fireEvent.keyDown(window, { code: 'Space', key: ' ' }));
    expect(screen.queryByRole('button', { name: /показати відповідь/ })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { code: 'ArrowRight', key: 'ArrowRight' });
    expect(await screen.findByText('картка 2 з 2')).toBeInTheDocument();
    expect(within(panel).getByText('нові').nextElementSibling).toHaveTextContent('1');
    expect(within(panel).getByText(/^коробка 2/).nextElementSibling).toHaveTextContent('1');

    fireEvent.keyDown(window, { code: 'ArrowLeft', key: 'ArrowLeft' });
    expect(await screen.findByRole('heading', { name: 'колоду пройдено' })).toBeInTheDocument();
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
