import { emptyState } from './server';
import { getRestaurant, loadState, resetDemo, saveState, setRestaurant } from './storage';

describe('demo storage', () => {
  beforeEach(() => resetDemo());

  it('defaults to «Просто ЛІС» and ignores unknown restaurants', () => {
    expect(getRestaurant()).toBe('lis');
    localStorage.setItem('vedmid-demo:restaurant', 'nope');
    expect(getRestaurant()).toBe('lis');
    setRestaurant('delikacia');
    expect(getRestaurant()).toBe('delikacia');
  });

  it('keeps progress per restaurant, and the original key for «Просто ЛІС»', () => {
    saveState({ ...emptyState(), unlocked: { 'ach-1': 'x' } });
    expect(JSON.parse(localStorage.getItem('vedmid-demo:state')!)).toMatchObject({
      unlocked: { 'ach-1': 'x' },
    });

    setRestaurant('delikacia');
    resetDemo(); // drops the in-memory copy, as a page reload would
    setRestaurant('delikacia');
    expect(loadState().unlocked).toEqual({});
    saveState({ ...emptyState(), unlocked: { 'ach-2': 'y' } });
    expect(localStorage.getItem('vedmid-demo:state:delikacia')).toContain('ach-2');
  });

  it('reset clears every restaurant', () => {
    setRestaurant('delikacia');
    saveState(emptyState());
    resetDemo();
    expect(localStorage.getItem('vedmid-demo:state:delikacia')).toBeNull();
    expect(getRestaurant()).toBe('lis');
  });
});
