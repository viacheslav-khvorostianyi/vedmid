import { Timer } from 'lucide-react';
import { useEffect, useReducer, useRef } from 'react';
import type { MenuItem } from '@/features/menu/types';
import { cn } from '@/lib/cn';
import { useHotkeys } from '@/lib/useHotkeys';
import { buildQuiz, QUIZ_LIVES, quizReducer, startQuiz } from '../engines/quiz';
import { useGameRecording } from '../hooks/useGameRecording';
import { useTicker } from '../hooks/useTicker';
import { GameResults, GameTopBar, Lives, NextButton, OptionButton, optionState } from './GameParts';

interface Props {
  items: readonly MenuItem[];
  keyboard: boolean;
  onRestart: () => void;
}

export default function QuizGame({ items, keyboard, onRestart }: Props) {
  const [state, dispatch] = useReducer(quizReducer, items, (it) => startQuiz(buildQuiz(it)));
  const over = state.status === 'over';
  const { recordAnswer, xpEarned } = useGameRecording('quiz', {
    over,
    score: state.correct,
    total: state.questions.length,
  });
  const question = state.questions[state.index];

  function pick(index: number) {
    if (state.status !== 'playing' || !question || index >= question.answers.length) return;
    void recordAnswer(question.itemId, index === question.correctIndex);
    dispatch({ type: 'pick', index });
  }

  useTicker(state.status === 'playing', () => dispatch({ type: 'tick' }));

  // A timeout comes from the reducer (several ticks may land between renders), so record it from state, once per question.
  const timeoutRecorded = useRef(-1);
  useEffect(() => {
    if (state.status !== 'answered' || state.picked !== -1 || timeoutRecorded.current === state.index) return;
    timeoutRecorded.current = state.index;
    void recordAnswer(state.questions[state.index].itemId, false);
  }, [state, recordAnswer]);

  useHotkeys(
    Object.fromEntries([0, 1, 2, 3].map((i) => [`Digit${i + 1}`, () => pick(i)])),
    keyboard && state.status === 'playing',
  );

  if (over) {
    return (
      <>
        <GameTopBar title="вікторина" />
        <GameResults
          title="вікторина"
          score={state.correct}
          total={state.questions.length}
          xpEarned={xpEarned}
          detail={state.lives <= 0 ? 'Життя закінчились — спробуй ще раз.' : undefined}
          onRestart={onRestart}
        />
      </>
    );
  }

  const last = state.lives <= 0 || state.index + 1 >= state.questions.length;
  return (
    <>
      <GameTopBar title="вікторина">
        <span
          role="timer"
          aria-label={`залишилось ${state.secondsLeft} секунд`}
          className={cn('flex items-center gap-1', state.secondsLeft <= 5 && 'text-warn')}
        >
          <Timer aria-hidden="true" className="size-4" strokeWidth={1.8} />
          {state.secondsLeft}
        </span>
        <Lives left={state.lives} max={QUIZ_LIVES} />
        <span>
          {state.index + 1}/{state.questions.length}
        </span>
      </GameTopBar>
      <p className="m-0 font-mono text-base leading-snug font-bold">{question.prompt}</p>
      <div className="flex flex-col gap-2.5">
        {question.answers.map((answer, i) => (
          <OptionButton
            key={i}
            state={optionState(i, state.picked, question.correctIndex)}
            onClick={() => pick(i)}
            hotkey={keyboard ? i + 1 : undefined}
          >
            {answer}
          </OptionButton>
        ))}
      </div>
      {state.status === 'answered' && (
        <>
          <p className="m-0 text-sm" aria-live="polite">
            {state.picked === -1
              ? 'Час вийшов.'
              : state.picked === question.correctIndex
                ? 'Правильно!'
                : 'Неправильно.'}
          </p>
          <NextButton last={last} onClick={() => dispatch({ type: 'next' })} />
        </>
      )}
    </>
  );
}
