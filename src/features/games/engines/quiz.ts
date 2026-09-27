import type { MenuItem } from '@/features/menu/types';
import { normalize } from '@/features/menu/model';
import { shuffle } from '@/lib/shuffle';
import { pickDistinct } from './common';

// Quiz: 10 questions, 15 s each, 3 lives (DESIGN §5.4). A timeout counts as a wrong answer.

export const QUIZ_LENGTH = 10;
export const QUIZ_LIVES = 3;
export const QUIZ_SECONDS = 15;
const OPTIONS = 4;

export interface QuizQuestion {
  itemId: string;
  kind: 'anchor' | 'ingredients';
  prompt: string;
  answers: string[];
  correctIndex: number;
}

export function buildQuiz(items: readonly MenuItem[], rng: () => number = Math.random): QuizQuestion[] {
  const anchorCounts = new Map<string, number>();
  for (const i of items)
    anchorCounts.set(normalize(i.anchor), (anchorCounts.get(normalize(i.anchor)) ?? 0) + 1);
  const usable = items.filter((i) => i.ingredients.trim());

  return shuffle(usable, rng)
    .slice(0, QUIZ_LENGTH)
    .map((item) => {
      // An anchor question only makes sense if the anchor points at exactly one item.
      const anchorOk = !!item.anchor.trim() && anchorCounts.get(normalize(item.anchor)) === 1;
      const kind = anchorOk && rng() < 0.5 ? 'anchor' : 'ingredients';
      const field = (i: MenuItem) => (kind === 'anchor' ? i.title : i.ingredients);
      const correct = field(item);
      const sameCategory = usable.filter((i) => i.id !== item.id && i.category === item.category).map(field);
      const others = usable.filter((i) => i.category !== item.category).map(field);
      let distractors = pickDistinct(sameCategory, OPTIONS - 1, [correct], rng);
      if (distractors.length < OPTIONS - 1) {
        distractors = [
          ...distractors,
          ...pickDistinct(others, OPTIONS - 1 - distractors.length, [correct, ...distractors], rng),
        ];
      }
      const answers = shuffle([correct, ...distractors], rng);
      return {
        itemId: item.id,
        kind,
        prompt:
          kind === 'anchor'
            ? `Яка позиція меню має «якір»: «${item.anchor}»?`
            : `Що входить до складу «${item.title}»?`,
        answers,
        correctIndex: answers.indexOf(correct),
      };
    });
}

export interface QuizState {
  questions: QuizQuestion[];
  index: number;
  lives: number;
  correct: number;
  secondsLeft: number;
  /** chosen answer; -1 = time ran out; null = not answered yet */
  picked: number | null;
  status: 'playing' | 'answered' | 'over';
}

export type QuizAction = { type: 'pick'; index: number } | { type: 'tick' } | { type: 'next' };

export function startQuiz(questions: QuizQuestion[]): QuizState {
  return {
    questions,
    index: 0,
    lives: QUIZ_LIVES,
    correct: 0,
    secondsLeft: QUIZ_SECONDS,
    picked: null,
    status: questions.length ? 'playing' : 'over',
  };
}

function answer(state: QuizState, index: number): QuizState {
  const right = index === state.questions[state.index].correctIndex;
  return {
    ...state,
    picked: index,
    status: 'answered',
    correct: state.correct + (right ? 1 : 0),
    lives: right ? state.lives : state.lives - 1,
  };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'pick':
      return state.status === 'playing' ? answer(state, action.index) : state;
    case 'tick':
      if (state.status !== 'playing') return state;
      return state.secondsLeft <= 1
        ? answer({ ...state, secondsLeft: 0 }, -1)
        : { ...state, secondsLeft: state.secondsLeft - 1 };
    case 'next':
      if (state.status !== 'answered') return state;
      if (state.lives <= 0 || state.index + 1 >= state.questions.length) return { ...state, status: 'over' };
      return { ...state, index: state.index + 1, secondsLeft: QUIZ_SECONDS, picked: null, status: 'playing' };
  }
}

export const lastAnswerCorrect = (s: QuizState) =>
  s.picked !== null && s.picked === s.questions[s.index]?.correctIndex;
