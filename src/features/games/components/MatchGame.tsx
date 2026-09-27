import { useReducer } from 'react';
import type { MenuItem } from '@/features/menu/types';
import { cn } from '@/lib/cn';
import {
  buildMatch,
  isMatchFinished,
  matchReducer,
  pairsTotal,
  startMatch,
  type MatchAction,
} from '../engines/match';
import { useGameRecording } from '../hooks/useGameRecording';
import { useTicker } from '../hooks/useTicker';
import { formatSeconds, GameResults, GameTopBar } from './GameParts';

interface Props {
  items: readonly MenuItem[];
  onRestart: () => void;
}

export default function MatchGame({ items, onRestart }: Props) {
  const [state, dispatch] = useReducer(matchReducer, items, (it) => startMatch(buildMatch(it)));
  const finished = isMatchFinished(state);
  const total = pairsTotal(state);
  const { recordAnswer, xpEarned } = useGameRecording('match', { over: finished, score: total, total });

  useTicker(!finished, () => dispatch({ type: 'tick' }));

  function tap(key: string) {
    const action: MatchAction = { type: 'tap', key };
    const next = matchReducer(state, action);
    if (next.event && next.event !== state.event)
      void recordAnswer(next.event.itemId, next.event.type === 'match');
    dispatch(action);
  }

  if (finished) {
    return (
      <>
        <GameTopBar title="пари" />
        <GameResults
          title="пари"
          score={total}
          total={total}
          xpEarned={xpEarned}
          detail={`Час: ${formatSeconds(state.elapsed)} · помилок: ${state.mistakes}`}
          onRestart={onRestart}
        />
      </>
    );
  }

  return (
    <>
      <GameTopBar title="пари">
        <span aria-label={`час ${formatSeconds(state.elapsed)}`}>{formatSeconds(state.elapsed)}</span>
        <span>помилок: {state.mistakes}</span>
        <span>
          {state.matched.length}/{total}
        </span>
      </GameTopBar>
      <p className="m-0 text-sm text-muted">З’єднай кожну позицію з її «якорем».</p>
      <div className="grid grid-cols-2 gap-2.5">
        {state.tiles.map((tile) => {
          const matched = state.matched.includes(tile.itemId);
          const selected = state.selected === tile.key;
          const missed = state.miss?.includes(tile.key);
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => tap(tile.key)}
              disabled={matched}
              aria-pressed={selected}
              className={cn(
                'flex min-h-20 flex-col items-center justify-center gap-1 rounded-ui border p-3 text-center text-[13.5px] leading-snug transition-colors',
                tile.kind === 'item' ? 'font-mono font-bold' : 'italic',
                matched && 'border-green bg-green text-text',
                !matched && selected && 'border-line bg-green/35 text-text',
                !matched && !selected && missed && 'border-warn-bg bg-warn-bg text-warn',
                !matched && !selected && !missed && 'border-line text-text hover:bg-green/20',
              )}
            >
              {tile.kind === 'anchor' && <span className="text-[11px] not-italic text-muted">якір</span>}
              {tile.text}
            </button>
          );
        })}
      </div>
      {state.miss && (
        <p className="m-0 text-sm text-warn" aria-live="polite">
          Не пара — спробуй ще.
        </p>
      )}
    </>
  );
}
