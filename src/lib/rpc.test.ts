import { pendingCalls, flushQueue } from './offlineQueue';
import { callOrQueue, classifyError, flushPendingCalls } from './rpc';
import { supabase } from './supabase';

vi.mock('./supabase', () => ({ supabase: { rpc: vi.fn() } }));
const rpc = vi.mocked(supabase.rpc);

const ARGS = { p_item_id: 'i1', p_correct: true, p_source: 'card' as const };
const RESULT = [{ xp: 5, level: 1, streak: 1, max_streak: 1, new_achievements: [] }];

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => value });
}

beforeEach(async () => {
  setOnline(true);
  rpc.mockReset();
  await flushQueue(async () => 'drop');
});

describe('classifyError', () => {
  it.each([
    [null, 'done'],
    [{ message: 'TypeError: Failed to fetch', status: 0 }, 'retry'],
    [{ message: 'Bad gateway', status: 502 }, 'retry'],
    [{ message: 'JWT expired', status: 401 }, 'retry'],
    [{ message: 'Too many', status: 429 }, 'retry'],
    [{ message: 'invalid input value for enum', status: 400 }, 'drop'],
    [{ message: 'permission denied', status: 403 }, 'drop'],
  ] as const)('%o → %s', (error, outcome) => {
    expect(classifyError(error, true)).toBe(outcome);
  });

  it('always retries while offline', () => {
    expect(classifyError({ message: 'x', status: 400 }, false)).toBe('retry');
  });
});

describe('callOrQueue', () => {
  it('returns the RPC result when online', async () => {
    rpc.mockResolvedValue({ data: RESULT, error: null, status: 200 } as never);
    expect(await callOrQueue('record_answer', ARGS)).toEqual({ status: 'done', data: RESULT });
    expect(await pendingCalls()).toEqual([]);
  });

  it('queues without calling when offline', async () => {
    setOnline(false);
    expect(await callOrQueue('record_answer', ARGS)).toEqual({ status: 'queued' });
    expect(rpc).not.toHaveBeenCalled();
    expect((await pendingCalls())[0]).toMatchObject({ fn: 'record_answer', args: ARGS });
  });

  it('queues on a network failure', async () => {
    rpc.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await callOrQueue('record_answer', ARGS)).toEqual({ status: 'queued' });
    expect(await pendingCalls()).toHaveLength(1);
  });

  it('fails without queueing on a permanent error', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'invalid score', code: '22023' },
      status: 400,
    } as never);
    expect(await callOrQueue('finish_game', { p_mode: 'quiz', p_score: 11, p_total: 10 })).toMatchObject({
      status: 'failed',
      error: { message: 'invalid score' },
    });
    expect(await pendingCalls()).toEqual([]);
  });

  it('flushes queued calls once back online', async () => {
    setOnline(false);
    await callOrQueue('record_answer', ARGS);
    setOnline(true);
    rpc.mockResolvedValue({ data: RESULT, error: null, status: 200 } as never);
    expect(await flushPendingCalls()).toEqual({ sent: 1, dropped: 0, remaining: 0 });
    expect(rpc).toHaveBeenCalledWith('record_answer', ARGS);
  });
});
