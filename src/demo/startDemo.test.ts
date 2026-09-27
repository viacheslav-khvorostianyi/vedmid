import { supabase } from '@/lib/supabase';
import { startDemo } from './startDemo';
import { isFirstVisit, resetDemo } from './storage';

vi.mock('msw/browser', () => ({ setupWorker: () => ({ start: vi.fn(async () => undefined) }) }));

describe('startDemo first visit', () => {
  beforeEach(() => resetDemo());

  it('keeps trying to sign in automatically until it succeeds', async () => {
    const setSession = vi.spyOn(supabase.auth, 'setSession');
    setSession.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: new Error('Load failed'),
    } as never);
    await startDemo();
    expect(isFirstVisit()).toBe(true);

    setSession.mockResolvedValueOnce({ data: { session: null, user: null }, error: null } as never);
    await startDemo();
    expect(isFirstVisit()).toBe(false);

    await startDemo();
    expect(setSession).toHaveBeenCalledTimes(2);
  });

  it('ignores the old v1 flag that a failed Safari sign-in could have left behind', () => {
    localStorage.setItem('vedmid-demo:started', '1');
    expect(isFirstVisit()).toBe(true);
  });
});
