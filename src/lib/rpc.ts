import { enqueue, flushQueue, type CallOutcome, type FlushResult, type QueuedCall } from './offlineQueue';
import type { Database } from './db.types';
import { supabase } from './supabase';

type Fns = Database['public']['Functions'];
export type QueueableFn = QueuedCall['fn'];

interface RpcError {
  message: string;
  code?: string;
  status?: number;
}

/** Network failures and server/auth hiccups are worth retrying; other client errors are not. */
export function classifyError(error: RpcError | null | undefined, online = navigator.onLine): CallOutcome {
  if (!error) return 'done';
  if (!online) return 'retry';
  const status = error.status ?? 0;
  if (status === 0 || status === 401 || status === 408 || status === 429 || status >= 500) return 'retry';
  if (/fetch|network|load failed/i.test(error.message)) return 'retry';
  return 'drop';
}

async function send(
  fn: QueueableFn,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: RpcError | null }> {
  try {
    const res = await supabase.rpc(fn, args as Fns[typeof fn]['Args']);
    return { data: res.data, error: res.error ? { ...res.error, status: res.status } : null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e), status: 0 } };
  }
}

export type RpcResult<T> =
  { status: 'done'; data: T } | { status: 'queued' } | { status: 'failed'; error: RpcError };

/**
 * Calls a progress RPC; if the device is offline or the call fails transiently, queues it for later.
 * The server recomputes XP when the queued call arrives.
 */
export async function callOrQueue<F extends QueueableFn>(
  fn: F,
  args: Fns[F]['Args'],
): Promise<RpcResult<Fns[F]['Returns']>> {
  if (!navigator.onLine) {
    await enqueue({ fn, args });
    return { status: 'queued' };
  }
  const { data, error } = await send(fn, args);
  const outcome = classifyError(error);
  if (outcome === 'done') return { status: 'done', data: data as Fns[F]['Returns'] };
  if (outcome === 'retry') {
    await enqueue({ fn, args });
    return { status: 'queued' };
  }
  return { status: 'failed', error: error! };
}

export function flushPendingCalls(): Promise<FlushResult> {
  return flushQueue(async (call) => classifyError((await send(call.fn, call.args)).error));
}
