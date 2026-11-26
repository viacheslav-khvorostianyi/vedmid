import { screen } from '@testing-library/react';
import type { CardProgress } from '@/features/flashcards/leitner';
import { flushPendingCalls } from '@/lib/rpc';
import { MENU } from '@/test/menuFixture';
import { renderRoute } from '@/test/renderRoute';
import { fetchCardProgress } from '../api';
import { isFromEarlierPageLoad } from '../hooks/useCardProgress';

vi.mock('@/lib/rpc', () => ({
  callOrQueue: vi.fn(),
  flushPendingCalls: vi.fn(async () => ({ sent: 0, dropped: 0, remaining: 0 })),
}));
vi.mock('../api', () => ({ fetchCardProgress: vi.fn() }));
const fetchProgress = vi.mocked(fetchCardProgress);

const FOOD = MENU.items.filter((i) => i.category === 'food');
const learned = (item: { id: string }): CardProgress => ({
  itemId: item.id,
  box: 5,
  lastResult: true,
  reviewedAt: new Date().toISOString(),
});
const counter = () => screen.getByText(/^картка \d+ з \d+$/);

describe('progress after a reload', () => {
  it('treats only data cached before this page load as restored', () => {
    expect(isFromEarlierPageLoad(1_000, 2_000)).toBe(true);
    expect(isFromEarlierPageLoad(3_000, 2_000)).toBe(false);
    expect(isFromEarlierPageLoad(0, 2_000)).toBe(false); // never fetched
  });

  it('builds the deck from the server, not from a restored copy that misses the last answer', async () => {
    // The offline copy was saved before the last answer; the server already has it.
    const restored = FOOD.slice(0, 10).map(learned);
    const server = FOOD.slice(0, 11).map(learned);
    let resolve!: (rows: CardProgress[]) => void;
    fetchProgress.mockReturnValue(new Promise((r) => (resolve = r)));

    renderRoute('/cards', undefined, { progress: restored, progressRestored: true });
    // no deck while the server is being asked
    expect(await screen.findByRole('tab', { name: 'їжа' })).toBeInTheDocument();
    expect(screen.queryByText(/^картка \d+ з \d+$/)).not.toBeInTheDocument();

    resolve(server);
    expect(await screen.findByText(/^картка \d+ з \d+$/)).toBeInTheDocument();
    expect(counter()).toHaveTextContent(`картка 1 з ${FOOD.filter((i) => i.ingredients.trim()).length - 11}`);
    // answers queued offline are sent before the server is asked
    expect(vi.mocked(flushPendingCalls).mock.invocationCallOrder[0]).toBeLessThan(
      fetchProgress.mock.invocationCallOrder[0],
    );
  });

  it('does not ask the server again for progress fetched in this page load', async () => {
    fetchProgress.mockClear();
    renderRoute('/cards', undefined, { progress: FOOD.slice(0, 10).map(learned) });
    expect(await screen.findByText(/^картка \d+ з \d+$/)).toBeInTheDocument();
    expect(fetchProgress).not.toHaveBeenCalled();
  });
});
