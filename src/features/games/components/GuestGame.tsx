import { useReducer } from 'react';
import { useHotkeys } from '@/lib/useHotkeys';
import Panel from '@/ui/Panel';
import { buildGuest, guestReducer, startGuest, type GuestScenario } from '../engines/guest';
import { useGameRecording } from '../hooks/useGameRecording';
import { GameResults, GameTopBar, NextButton, OptionButton, optionState } from './GameParts';

interface Props {
  scenarios: readonly GuestScenario[];
  keyboard: boolean;
  onRestart: () => void;
}

export default function GuestGame({ scenarios, keyboard, onRestart }: Props) {
  const [state, dispatch] = useReducer(guestReducer, scenarios, (s) => startGuest(buildGuest(s)));
  const over = state.status === 'over';
  const { recordAnswer, xpEarned } = useGameRecording('guest', {
    over,
    score: state.correct,
    total: state.scenarios.length,
  });
  const scenario = state.scenarios[state.index];

  function choose(index: number) {
    const option = scenario?.options[index];
    if (state.status !== 'playing' || !option) return;
    void recordAnswer(null, option.correct);
    dispatch({ type: 'choose', index });
  }

  useHotkeys(
    Object.fromEntries([0, 1, 2, 3].map((i) => [`Digit${i + 1}`, () => choose(i)])),
    keyboard && state.status === 'playing',
  );

  if (over) {
    return (
      <>
        <GameTopBar title="гість" />
        <GameResults
          title="гість"
          score={state.correct}
          total={state.scenarios.length}
          xpEarned={xpEarned}
          onRestart={onRestart}
        />
      </>
    );
  }

  const correctIndex = scenario.options.findIndex((o) => o.correct);
  const chosen = state.choice !== null ? scenario.options[state.choice] : null;
  return (
    <>
      <GameTopBar title="гість">
        <span>
          {state.index + 1}/{state.scenarios.length}
        </span>
      </GameTopBar>
      <figure className="m-0 flex flex-col gap-2">
        <figcaption className="text-sm text-muted">
          {scenario.avatar && <span aria-hidden="true">{scenario.avatar} </span>}
          {scenario.persona}
        </figcaption>
        <blockquote className="m-0 rounded-ui border border-line-soft bg-bg-raised px-4 py-3 text-[15px] leading-relaxed">
          «{scenario.quote}»
        </blockquote>
      </figure>
      <p className="m-0 text-sm text-muted">Що порадиш?</p>
      <div className="flex flex-col gap-2.5">
        {scenario.options.map((option, i) => (
          <OptionButton
            key={i}
            state={optionState(i, state.choice, correctIndex)}
            onClick={() => choose(i)}
            hotkey={keyboard ? i + 1 : undefined}
          >
            {option.text}
          </OptionButton>
        ))}
      </div>
      {chosen && (
        <>
          <div aria-live="polite">
            <Panel>{chosen.feedback || (chosen.correct ? 'Правильно!' : 'Не найкращий варіант.')}</Panel>
          </div>
          <NextButton
            last={state.index + 1 >= state.scenarios.length}
            onClick={() => dispatch({ type: 'next' })}
          />
        </>
      )}
    </>
  );
}
