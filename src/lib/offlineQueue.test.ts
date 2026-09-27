import { enqueue, flushQueue, pendingCalls, type CallOutcome, type QueuedCall } from './offlineQueue';

async function drain() {
  await flushQueue(async () => 'drop');
}

beforeEach(drain);

const card = (n: number) => ({
  fn: 'record_answer' as const,
  args: { p_item_id: `item-${n}`, p_correct: true, p_source: 'card' },
});

describe('offlineQueue', () => {
  it('keeps calls in order across reads', async () => {
    await enqueue(card(1));
    await enqueue(card(2));
    const calls = await pendingCalls();
    expect(calls.map((c) => c.args.p_item_id)).toEqual(['item-1', 'item-2']);
    expect(calls[0].id).not.toBe(calls[1].id);
  });

  it('sends FIFO and removes sent and dropped calls', async () => {
    await enqueue(card(1));
    await enqueue(card(2));
    await enqueue(card(3));
    const seen: unknown[] = [];
    const outcomes: CallOutcome[] = ['done', 'drop', 'done'];
    const result = await flushQueue(async (c) => {
      seen.push(c.args.p_item_id);
      return outcomes[seen.length - 1];
    });
    expect(seen).toEqual(['item-1', 'item-2', 'item-3']);
    expect(result).toEqual({ sent: 2, dropped: 1, remaining: 0 });
  });

  it('stops at the first retry and keeps the rest in order', async () => {
    await enqueue(card(1));
    await enqueue(card(2));
    await enqueue(card(3));
    let n = 0;
    const result = await flushQueue(async () => (++n === 2 ? 'retry' : 'done'));
    expect(result).toEqual({ sent: 1, dropped: 0, remaining: 2 });
    expect((await pendingCalls()).map((c) => c.args.p_item_id)).toEqual(['item-2', 'item-3']);
  });

  it('shares one run between concurrent flushes, so nothing is sent twice', async () => {
    await enqueue(card(1));
    await enqueue(card(2));
    const execute = vi.fn(async (): Promise<CallOutcome> => 'done');
    const [a, b] = await Promise.all([flushQueue(execute), flushQueue(execute)]);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(a).toBe(b);
  });

  it('also sends calls enqueued while flushing', async () => {
    await enqueue(card(1));
    const seen: string[] = [];
    await flushQueue(async (c: QueuedCall) => {
      seen.push(String(c.args.p_item_id));
      if (seen.length === 1) await enqueue(card(2));
      return 'done';
    });
    expect(seen).toEqual(['item-1', 'item-2']);
    expect(await pendingCalls()).toEqual([]);
  });
});
