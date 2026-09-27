import { seededRng } from '@/lib/shuffle';
import { buildGuest, guestReducer, startGuest, type GuestScenario } from './guest';

const scenario = (id: string): GuestScenario => ({
  id,
  persona: 'Гість',
  avatar: '',
  quote: '?',
  options: [
    { text: 'так', correct: false, feedback: 'ні' },
    { text: 'правильно', correct: true, feedback: 'так' },
    { text: 'може', correct: false, feedback: 'ні' },
  ],
});

describe('guest', () => {
  it('keeps scenario order and shuffles options without losing any', () => {
    const built = buildGuest([scenario('g-1'), scenario('g-2')], seededRng(9));
    expect(built.map((s) => s.id)).toEqual(['g-1', 'g-2']);
    expect(built[0].options.map((o) => o.text).sort()).toEqual(['може', 'правильно', 'так']);
  });

  it('answers once per scenario, counts correct ones, and ends after the last', () => {
    let s = guestReducer(startGuest([scenario('a'), scenario('b')]), { type: 'choose', index: 1 });
    expect(s).toMatchObject({ status: 'answered', choice: 1, correct: 1 });
    expect(guestReducer(s, { type: 'choose', index: 0 })).toBe(s);
    s = guestReducer(s, { type: 'next' });
    expect(s).toMatchObject({ index: 1, choice: null, status: 'playing' });
    expect(guestReducer(s, { type: 'next' })).toBe(s);
    expect(guestReducer(s, { type: 'choose', index: 7 })).toBe(s);
    s = guestReducer(guestReducer(s, { type: 'choose', index: 0 }), { type: 'next' });
    expect(s).toMatchObject({ status: 'over', correct: 1 });
    expect(startGuest([]).status).toBe('over');
  });
});
