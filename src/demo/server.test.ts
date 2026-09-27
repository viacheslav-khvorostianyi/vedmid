import { emptyState, finishGame, recordAnswer, type AnswerInput, type DemoState } from './server';

const NOW = new Date('2026-09-27T12:00:00Z');
const answer = (state: DemoState, input: Partial<AnswerInput>) =>
  recordAnswer(state, { p_item_id: null, p_correct: true, p_source: 'quiz', ...input }, NOW);

describe('demo server (mirrors record_answer)', () => {
  it.each([
    ['card', 5],
    ['quiz', 10],
    ['match', 5],
    ['recipe', 15],
    ['guest', 20],
  ] as const)('awards XP for a correct %s answer', (source, xp) => {
    expect(answer(emptyState(), { p_source: source, p_item_id: 'i' }).result[0]).toMatchObject({
      xp,
      streak: 1,
      level: 1,
    });
  });

  it('resets the streak on a wrong answer and keeps max_streak', () => {
    let s = emptyState();
    for (const correct of [true, true, false]) s = answer(s, { p_correct: correct }).state;
    expect(s.stats).toMatchObject({ xp: 20, streak: 0, max_streak: 2, correct_answers: 2, total_answers: 3 });
  });

  it('moves flashcards through the Leitner boxes', () => {
    let s = emptyState();
    s = answer(s, { p_source: 'card', p_item_id: 'a' }).state;
    expect(s.progress.a).toMatchObject({ box: 2, times_seen: 1, times_known: 1 });
    for (let i = 0; i < 5; i++) s = answer(s, { p_source: 'card', p_item_id: 'a' }).state;
    expect(s.progress.a.box).toBe(5);
    s = answer(s, { p_source: 'card', p_item_id: 'a', p_correct: false }).state;
    expect(s.progress.a).toMatchObject({ box: 1, times_seen: 7, times_known: 6, last_result: false });
  });

  it('unlocks achievements once, with bonus XP, cascading like the SQL', () => {
    let s = emptyState();
    let result;
    for (let i = 0; i < 5; i++) ({ state: s, result } = answer(s, { p_source: 'card', p_item_id: 'a' }));
    expect(result![0].new_achievements).toEqual(['ach-2', 'ach-1']);
    expect(result![0].xp).toBe(175);
    expect(answer(s, { p_source: 'card', p_item_id: 'a' }).result[0].new_achievements).toEqual([]);
  });

  it('does not mutate the previous state', () => {
    const s = emptyState();
    answer(s, { p_source: 'card', p_item_id: 'a' });
    expect(s).toEqual(emptyState());
  });

  it('stores finished games and rejects impossible scores', () => {
    const ok = finishGame(emptyState(), { p_mode: 'quiz', p_score: 8, p_total: 10 }, NOW);
    expect('state' in ok ? ok.state?.games : null).toEqual([
      { mode: 'quiz', score: 8, total: 10, created_at: NOW.toISOString() },
    ]);
    expect(finishGame(emptyState(), { p_mode: 'quiz', p_score: 11, p_total: 10 }, NOW)).toEqual({
      error: { code: '22023', message: 'invalid score' },
    });
  });
});
