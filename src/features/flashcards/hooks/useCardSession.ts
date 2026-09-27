import { useCallback, useMemo, useReducer } from 'react';
import type { MenuItem } from '@/features/menu/types';
import { buildDeck, type CardProgress } from '../leitner';
import { currentCard, isFinished, sessionReducer, startSession, summary } from '../session';
import { useAnswerCard } from './useCardProgress';

/**
 * A run through today's deck for the given items. The deck is fixed when the session starts
 * (remount with a new `key` to rebuild it), so answering does not reshuffle the cards under the user.
 * `practiceAll` ignores the schedule and uses every card (for when nothing is due).
 */
export function useCardSession(
  items: readonly MenuItem[],
  progress: readonly CardProgress[],
  practiceAll = false,
) {
  const [state, dispatch] = useReducer(sessionReducer, null, () =>
    startSession(
      (practiceAll ? buildDeck(items, [], Date.now()) : buildDeck(items, progress, Date.now())).map(
        (i) => i.id,
      ),
    ),
  );
  const answerCard = useAnswerCard();
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const id = currentCard(state);
  const answer = useCallback(
    (known: boolean) => {
      if (!id) return;
      dispatch({ type: 'answer', known });
      void answerCard(id, known);
    },
    [id, answerCard],
  );

  return {
    card: id ? byId.get(id) : undefined,
    position: Math.min(state.index + 1, state.deck.length),
    total: state.deck.length,
    flipped: state.flipped,
    finished: isFinished(state),
    summary: summary(state),
    flip: useCallback(() => dispatch({ type: 'flip' }), []),
    answer,
    restart: useCallback((mode: 'all' | 'mistakes') => dispatch({ type: 'restart', mode }), []),
  };
}

export type CardSession = ReturnType<typeof useCardSession>;
