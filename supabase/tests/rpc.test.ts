// @vitest-environment node
// PGlite boots a full Postgres in-process; allow for slow CI machines.
vi.setConfig({ hookTimeout: 60_000, testTimeout: 30_000 });
import type { PGlite } from '@electric-sql/pglite';
import { actAs, actAsAdmin, createTestDb, createUser } from './db';
import { seedMenuFixture } from './fixtures';

type Result = { xp: number; level: number; streak: number; max_streak: number; new_achievements: string[] };

let db: PGlite;
let itemId: string;

beforeAll(async () => {
  db = await createTestDb();
  itemId = (await seedMenuFixture(db)).activeId;
});
afterAll(() => db.close());

async function answer(correct: boolean, source = 'card', item: string | null = itemId) {
  const { rows } = await db.query<Result>(`select * from public.record_answer($1, $2, $3)`, [
    item,
    correct,
    source,
  ]);
  return rows[0];
}

async function freshUser(name: string) {
  const id = await createUser(db, `${name}@test.local`);
  await actAs(db, id);
  return id;
}

describe('record_answer', () => {
  it.each([
    ['card', 5],
    ['quiz', 10],
    ['match', 5],
    ['recipe', 15],
    ['guest', 20],
  ])('awards XP for a correct %s answer', async (source, xp) => {
    await freshUser(`xp-${source}`);
    expect(await answer(true, source, source === 'card' ? itemId : null)).toMatchObject({
      xp,
      streak: 1,
      level: 1,
    });
  });

  it('gives 0 XP and resets the streak on a wrong answer, keeping max_streak', async () => {
    await freshUser('streak');
    await answer(true, 'quiz', null);
    await answer(true, 'quiz', null);
    expect(await answer(false, 'quiz', null)).toMatchObject({ xp: 20, streak: 0, max_streak: 2 });
  });

  it('moves the Leitner box up to 5 and back to 1 on a miss', async () => {
    const uid = await freshUser('leitner');
    const box = async () =>
      (
        await db.query<{ box: number; times_seen: number; times_known: number }>(
          `select box, times_seen, times_known from public.card_progress where user_id = $1 and item_id = $2`,
          [uid, itemId],
        )
      ).rows[0];
    await answer(true);
    expect((await box()).box).toBe(2);
    for (let i = 0; i < 5; i++) await answer(true);
    expect((await box()).box).toBe(5);
    await answer(false);
    expect(await box()).toEqual({ box: 1, times_seen: 7, times_known: 6 });
  });

  it('does not touch card_progress for game answers', async () => {
    const uid = await freshUser('game-only');
    await answer(true, 'quiz', itemId);
    const { rows } = await db.query(`select 1 from public.card_progress where user_id = $1`, [uid]);
    expect(rows).toHaveLength(0);
  });

  it('unlocks achievements, adds their bonus, and cascades within the same answer', async () => {
    await freshUser('ach');
    // 5 correct guest answers: xp 100 and max_streak 5 → ach-1 (+50) and ach-2 (+100) together
    let last: Result | undefined;
    for (let i = 0; i < 5; i++) last = await answer(true, 'guest', null);
    expect(last!.new_achievements.sort()).toEqual(['ach-1', 'ach-2']);
    expect(last!.xp).toBe(250);
    expect(last!.level).toBe(2);
    // unlocked once only
    expect((await answer(true, 'guest', null)).new_achievements).toEqual([]);
  });

  it('cascades when a bonus crosses another threshold', async () => {
    await freshUser('cascade');
    // 5 card answers = 25 XP, streak 5 → ach-2 (+100) → 125 XP ≥ 100 → ach-1 (+50) in the same call
    let last: Result | undefined;
    for (let i = 0; i < 5; i++) last = await answer(true);
    expect(last!.new_achievements).toEqual(['ach-2', 'ach-1']);
    expect(last!.xp).toBe(175);
  });

  it('awards no XP beyond 120 answers in 10 minutes', async () => {
    const uid = await freshUser('farmer');
    await actAsAdmin(db);
    await db.query(
      `insert into public.answer_log (user_id, source, correct) select $1, 'quiz', true from generate_series(1, 120)`,
      [uid],
    );
    await actAs(db, uid);
    expect((await answer(true, 'quiz', null)).xp).toBe(0);
  });

  it('rejects unauthenticated calls', async () => {
    await actAsAdmin(db);
    await expect(answer(true, 'quiz', null)).rejects.toThrow(/not authenticated/);
  });
});

describe('finish_game', () => {
  it('records a valid result and rejects impossible scores', async () => {
    const uid = await freshUser('gamer');
    await db.query(`select public.finish_game('quiz', 8, 10)`);
    const { rows } = await db.query(`select mode, score, total from public.game_results where user_id = $1`, [
      uid,
    ]);
    expect(rows).toEqual([{ mode: 'quiz', score: 8, total: 10 }]);
    await expect(db.query(`select public.finish_game('quiz', 11, 10)`)).rejects.toThrow(/invalid score/);
    await expect(db.query(`select public.finish_game('quiz', -1, 10)`)).rejects.toThrow(/invalid score/);
  });
});
