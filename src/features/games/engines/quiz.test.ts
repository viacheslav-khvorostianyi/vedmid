import { normalize } from '@/features/menu/model';
import type { MenuItem } from '@/features/menu/types';
import { seededRng } from '@/lib/shuffle';
import { MENU } from '@/test/menuFixture';
import {
  buildQuiz,
  lastAnswerCorrect,
  QUIZ_LENGTH,
  QUIZ_LIVES,
  QUIZ_SECONDS,
  quizReducer,
  startQuiz,
  type QuizQuestion,
} from './quiz';

const q = (correctIndex: number): QuizQuestion => ({
  itemId: 'x',
  kind: 'ingredients',
  prompt: '?',
  answers: ['a', 'b', 'c', 'd'],
  correctIndex,
});

describe('buildQuiz', () => {
  const questions = buildQuiz(MENU.items, seededRng(11));

  it('makes 10 questions about different items, each with 4 distinct answers and one correct', () => {
    expect(questions).toHaveLength(QUIZ_LENGTH);
    expect(new Set(questions.map((x) => x.itemId)).size).toBe(QUIZ_LENGTH);
    for (const x of questions) {
      expect(x.answers).toHaveLength(4);
      expect(new Set(x.answers.map(normalize)).size).toBe(4);
      const item = MENU.items.find((i) => i.id === x.itemId)!;
      expect(x.answers[x.correctIndex]).toBe(x.kind === 'anchor' ? item.title : item.ingredients);
    }
  });

  it('never invents answers', () => {
    const real = new Set(MENU.items.flatMap((i) => [i.title, i.ingredients]));
    for (const x of questions) x.answers.forEach((a) => expect(real).toContain(a));
  });

  it('uses both question kinds and anchor questions only for unique anchors', () => {
    const many = Array.from({ length: 5 }, (_, s) => buildQuiz(MENU.items, seededRng(s))).flat();
    expect(new Set(many.map((x) => x.kind))).toEqual(new Set(['anchor', 'ingredients']));
    const dupAnchor = { ...MENU.items[0], id: 'dup', anchor: MENU.items[1].anchor } as MenuItem;
    const withDup = buildQuiz([MENU.items[1], dupAnchor, ...MENU.items.slice(2, 9)], seededRng(3));
    expect(
      withDup.filter((x) => x.kind === 'anchor' && (x.itemId === 'dup' || x.itemId === MENU.items[1].id)),
    ).toEqual([]);
  });

  it('borrows answers from other categories when a category is too small', () => {
    const lonely = [
      MENU.items.find((i) => i.category === 'wine')!,
      ...MENU.items.filter((i) => i.category === 'food').slice(0, 5),
    ];
    const wineQ = buildQuiz(lonely, seededRng(2)).find((x) => x.itemId === lonely[0].id)!;
    expect(wineQ.answers).toHaveLength(4);
  });
});

describe('quizReducer', () => {
  it('counts a right answer and keeps lives', () => {
    const s = quizReducer(startQuiz([q(2), q(0)]), { type: 'pick', index: 2 });
    expect(s).toMatchObject({ status: 'answered', correct: 1, lives: QUIZ_LIVES, picked: 2 });
    expect(lastAnswerCorrect(s)).toBe(true);
  });

  it('takes a life for a wrong answer and ignores a second pick', () => {
    const s = quizReducer(startQuiz([q(2)]), { type: 'pick', index: 1 });
    expect(s).toMatchObject({ correct: 0, lives: QUIZ_LIVES - 1 });
    expect(quizReducer(s, { type: 'pick', index: 2 })).toBe(s);
    expect(lastAnswerCorrect(s)).toBe(false);
  });

  it('counts down and treats running out of time as a wrong answer', () => {
    let s = startQuiz([q(0)]);
    for (let i = 0; i < QUIZ_SECONDS - 1; i++) s = quizReducer(s, { type: 'tick' });
    expect(s).toMatchObject({ secondsLeft: 1, status: 'playing' });
    s = quizReducer(s, { type: 'tick' });
    expect(s).toMatchObject({ secondsLeft: 0, picked: -1, status: 'answered', lives: QUIZ_LIVES - 1 });
    expect(quizReducer(s, { type: 'tick' })).toBe(s);
  });

  it('moves to the next question with a fresh timer', () => {
    let s = quizReducer(startQuiz([q(0), q(1)]), { type: 'tick' });
    expect(quizReducer(s, { type: 'next' })).toBe(s); // not answered yet
    s = quizReducer(quizReducer(s, { type: 'pick', index: 0 }), { type: 'next' });
    expect(s).toMatchObject({ index: 1, secondsLeft: QUIZ_SECONDS, picked: null, status: 'playing' });
  });

  it('ends after the last question or when lives run out', () => {
    let s = quizReducer(quizReducer(startQuiz([q(0)]), { type: 'pick', index: 0 }), { type: 'next' });
    expect(s.status).toBe('over');
    s = startQuiz([q(0), q(0), q(0), q(0), q(0)]);
    for (let i = 0; i < QUIZ_LIVES; i++)
      s = quizReducer(quizReducer(s, { type: 'pick', index: 3 }), { type: 'next' });
    expect(s).toMatchObject({ status: 'over', lives: 0, index: 2 });
  });

  it('is over at once with no questions', () => {
    expect(startQuiz([]).status).toBe('over');
  });
});
