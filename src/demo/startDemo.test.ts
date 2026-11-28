import { supabase } from '@/lib/supabase';
import { startDemo } from './startDemo';
import { getRestaurant, isFirstVisit, resetDemo } from './storage';
import { getBrand } from '@/lib/brand';

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

describe('startDemo restaurant link', () => {
  beforeEach(() => resetDemo());
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('switches to the restaurant named in ?r= and keeps it', async () => {
    window.history.replaceState(null, '', '/menu?r=delikacia');
    await startDemo();
    expect(getRestaurant()).toBe('delikacia');
    expect(getBrand().name).toBe('Delikacia');

    window.history.replaceState(null, '', '/menu');
    await startDemo();
    expect(getRestaurant()).toBe('delikacia');

    window.history.replaceState(null, '', '/menu?r=lis');
    await startDemo();
    expect(getRestaurant()).toBe('lis');
  });

  it('ignores an unknown restaurant', async () => {
    window.history.replaceState(null, '', '/menu?r=nope');
    await startDemo();
    expect(getRestaurant()).toBe('lis');
  });
});
