import { useReducer } from 'react';
import type { MenuItem } from '@/features/menu/types';
import { cn } from '@/lib/cn';
import Button from '@/ui/Button';
import { buildRecipe, isPerfect, recipeReducer, startRecipe } from '../engines/recipe';
import { useGameRecording } from '../hooks/useGameRecording';
import { GameResults, GameTopBar, NextButton } from './GameParts';

interface Props {
  items: readonly MenuItem[];
  onRestart: () => void;
}

export default function RecipeGame({ items, onRestart }: Props) {
  const [state, dispatch] = useReducer(recipeReducer, items, (it) => startRecipe(buildRecipe(it)));
  const over = state.status === 'over';
  const { recordAnswer, xpEarned } = useGameRecording('recipe', {
    over,
    score: state.perfect,
    total: state.rounds.length,
  });
  const round = state.rounds[state.index];

  if (over) {
    return (
      <>
        <GameTopBar title="рецепт" />
        <GameResults
          title="рецепт"
          score={state.perfect}
          total={state.rounds.length}
          xpEarned={xpEarned}
          detail="Зараховуються лише повністю правильні страви."
          onRestart={onRestart}
        />
      </>
    );
  }

  const checked = state.status === 'checked';
  function submit() {
    if (state.status !== 'playing' || state.selected.length === 0) return;
    void recordAnswer(round.itemId, isPerfect(round, state.selected));
    dispatch({ type: 'submit' });
  }

  return (
    <>
      <GameTopBar title="рецепт">
        <span>
          {state.index + 1}/{state.rounds.length}
        </span>
      </GameTopBar>
      <p className="m-0 text-sm text-muted">Обери все, що входить до складу:</p>
      <p className="m-0 font-mono text-base leading-snug font-bold">{round.title}</p>
      <div className="grid grid-cols-2 gap-2.5">
        {round.options.map((option, i) => {
          const selected = state.selected.includes(i);
          return (
            <button
              key={i}
              type="button"
              aria-pressed={selected}
              disabled={checked}
              onClick={() => dispatch({ type: 'toggle', index: i })}
              className={cn(
                'min-h-12 rounded-ui border px-3 py-2.5 text-left text-[13.5px] leading-snug transition-colors',
                !checked &&
                  (selected ? 'border-green bg-green text-text' : 'border-line text-text hover:bg-green/20'),
                checked && option.correct && selected && 'border-green bg-green text-text',
                checked && option.correct && !selected && 'border-2 border-line text-text',
                checked && !option.correct && selected && 'border-warn-bg bg-warn-bg text-warn',
                checked && !option.correct && !selected && 'border-line-soft text-muted',
              )}
            >
              {option.text}
              {checked && option.correct && !selected && <span className="sr-only"> — пропущено</span>}
              {checked && !option.correct && selected && <span className="sr-only"> — зайве</span>}
            </button>
          );
        })}
      </div>
      {checked ? (
        <>
          <p className="m-0 text-sm" aria-live="polite">
            {isPerfect(round, state.selected)
              ? 'Ідеально!'
              : 'Не зовсім: обведені — пропущені, помаранчеві — зайві.'}
          </p>
          <NextButton
            last={state.index + 1 >= state.rounds.length}
            onClick={() => dispatch({ type: 'next' })}
          />
        </>
      ) : (
        <Button fullWidth disabled={state.selected.length === 0} onClick={submit}>
          перевірити
        </Button>
      )}
    </>
  );
}
