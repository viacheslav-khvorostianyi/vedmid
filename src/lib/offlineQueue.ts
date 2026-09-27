import { createStore, get, set } from 'idb-keyval';

// Answers given without a connection are stored here (IndexedDB) and sent later, in order.

export interface QueuedCall {
  id: string;
  fn: 'record_answer' | 'finish_game';
  args: Record<string, unknown>;
  queuedAt: number;
}

/** done = sent, drop = rejected for good (don't retry), retry = keep it and stop flushing for now */
export type CallOutcome = 'done' | 'drop' | 'retry';

const KEY = 'queue:v1';
let store: ReturnType<typeof createStore> | undefined;
const db = () => (store ??= createStore('vedmid-offline', 'calls'));

const read = async () => (await get<QueuedCall[]>(KEY, db())) ?? [];

export async function enqueue(call: Omit<QueuedCall, 'id' | 'queuedAt'>): Promise<QueuedCall> {
  const queued: QueuedCall = { ...call, id: crypto.randomUUID(), queuedAt: Date.now() };
  await set(KEY, [...(await read()), queued], db());
  return queued;
}

export function pendingCalls(): Promise<QueuedCall[]> {
  return read();
}

let flushing: Promise<FlushResult> | null = null;

export interface FlushResult {
  sent: number;
  dropped: number;
  remaining: number;
}

/**
 * Sends queued calls FIFO. Stops at the first `retry` so order is preserved.
 * Concurrent calls share one run, so nothing is sent twice.
 */
export function flushQueue(execute: (call: QueuedCall) => Promise<CallOutcome>): Promise<FlushResult> {
  flushing ??= (async () => {
    let sent = 0;
    let dropped = 0;
    try {
      for (;;) {
        const [head] = await read();
        if (!head) break;
        const outcome = await execute(head);
        if (outcome === 'retry') break;
        if (outcome === 'done') sent++;
        else dropped++;
        // remove by id: calls enqueued meanwhile stay
        await set(
          KEY,
          (await read()).filter((c) => c.id !== head.id),
          db(),
        );
      }
      return { sent, dropped, remaining: (await read()).length };
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}
