import type { MenuItem } from '@/features/menu/types';
import { MenuError, MenuLoading } from '@/features/menu/components/MenuStatus';
import Button from '@/ui/Button';
import ChipRow from '@/ui/ChipRow';
import Flashcard from '../../components/Flashcard';
import { AllCaughtUp, SessionSummary } from '../../components/SessionEnd';
import { useCardSession } from '../../hooks/useCardSession';
import { useCardsScreen } from '../../hooks/useCardsScreen';
import { FILTER_OPTIONS } from '../../hooks/useCardsFilter';
import type { CardProgress } from '../../leitner';

function Session(props: {
  items: readonly MenuItem[];
  progress: readonly CardProgress[];
  practiceAll: boolean;
  onPracticeAll: () => void;
}) {
  const s = useCardSession(props.items, props.progress, props.practiceAll);

  if (s.total === 0) return <AllCaughtUp onPracticeAll={props.onPracticeAll} />;
  if (s.finished || !s.card) return <SessionSummary {...s.summary} onRestart={s.restart} />;

  return (
    <>
      <p className="m-0 text-sm text-muted tabular-nums" aria-live="polite">
        картка {s.position} з {s.total}
      </p>
      <Flashcard key={s.card.id} item={s.card} flipped={s.flipped} onFlip={s.flip} onSwipe={s.answer} />
      <div className="mt-6 grid grid-cols-2 gap-10">
        <Button variant="no" onClick={() => s.answer(false)}>
          не знаю
        </Button>
        <Button onClick={() => s.answer(true)}>знаю</Button>
      </div>
      <p id="flashcard-hint" className="m-0 text-center text-xs text-muted">
        свайп ← не знаю · свайп → знаю
      </p>
    </>
  );
}

export default function CardsView() {
  const screen = useCardsScreen();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">картки</h1>
      <ChipRow
        id="cards-filter"
        label="категорії карток"
        options={FILTER_OPTIONS}
        value={screen.filter}
        onChange={screen.setFilter}
      />
      {screen.failed ? (
        <MenuError onRetry={screen.retry} />
      ) : !screen.ready ? (
        <MenuLoading cards={1} />
      ) : (
        <Session
          key={screen.sessionKey}
          items={screen.items}
          progress={screen.progress}
          practiceAll={screen.practiceAll}
          onPracticeAll={screen.startPracticeAll}
        />
      )}
    </div>
  );
}
