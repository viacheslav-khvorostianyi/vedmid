import { seededRng } from '@/lib/shuffle';
import { currentCard, isFinished, sessionReducer, startSession, summary } from './session';

describe('card session', () => {
  it('flips, answers, and advances to the next unflipped card', () => {
    let s = startSession(['a', 'b']);
    s = sessionReducer(s, { type: 'flip' });
    expect(s.flipped).toBe(true);
    s = sessionReducer(s, { type: 'answer', known: true });
    expect(s).toMatchObject({ index: 1, flipped: false, results: { a: true } });
    expect(currentCard(s)).toBe('b');
  });

  it('finishes after the last card and ignores further input', () => {
    let s = startSession(['a']);
    s = sessionReducer(s, { type: 'answer', known: false });
    expect(isFinished(s)).toBe(true);
    expect(sessionReducer(s, { type: 'flip' })).toBe(s);
    expect(sessionReducer(s, { type: 'answer', known: true })).toBe(s);
    expect(summary(s)).toEqual({ known: 0, unknown: 1 });
  });

  it('restarts with all cards or only the mistakes', () => {
    let s = startSession(['a', 'b', 'c']);
    for (const known of [true, false, false]) s = sessionReducer(s, { type: 'answer', known });
    expect(summary(s)).toEqual({ known: 1, unknown: 2 });
    const mistakes = sessionReducer(s, { type: 'restart', mode: 'mistakes', rng: seededRng(3) });
    expect([...mistakes.deck].sort()).toEqual(['b', 'c']);
    expect(mistakes).toMatchObject({ index: 0, results: {} });
    const all = sessionReducer(s, { type: 'restart', mode: 'all', rng: seededRng(3) });
    expect([...all.deck].sort()).toEqual(['a', 'b', 'c']);
  });
});
