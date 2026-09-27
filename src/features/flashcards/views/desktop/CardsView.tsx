import type { MenuItem } from '@/features/menu/types';
import { MenuError, MenuLoading } from '@/features/menu/components/MenuStatus';
import { cn } from '@/lib/cn';
import { useHotkeys } from '@/lib/useHotkeys';
import DesktopPage from '@/shells/desktop/DesktopPage';
import Button from '@/ui/Button';
import ChipRow from '@/ui/ChipRow';
import BoxDistributionPanel from '../../components/BoxDistributionPanel';
import CardAnswer from '../../components/CardAnswer';
import CardQuestion from '../../components/CardQuestion';
import { AllCaughtUp, SessionSummary } from '../../components/SessionEnd';
import { useCardSession } from '../../hooks/useCardSession';
import { useCardsScreen } from '../../hooks/useCardsScreen';
import { FILTER_OPTIONS } from '../../hooks/useCardsFilter';
import type { CardProgress } from '../../leitner';

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded border border-b-2 border-muted/60 px-1.5 font-mono text-[11.5px] text-text">
    {children}
  </kbd>
);

function Session(props: {
  items: readonly MenuItem[];
  progress: readonly CardProgress[];
  practiceAll: boolean;
  onPracticeAll: () => void;
}) {
  const s = useCardSession(props.items, props.progress, props.practiceAll);
  const active = !!s.card && !s.finished;

  useHotkeys(
    {
      Space: () => s.flip(),
      ArrowLeft: () => s.answer(false),
      ArrowRight: () => s.answer(true),
    },
    active,
  );

  if (s.total === 0) return <AllCaughtUp onPracticeAll={props.onPracticeAll} />;
  if (!active) return <SessionSummary {...s.summary} onRestart={s.restart} />;
  const card = s.card!;

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-5">
      <p className="m-0 text-sm text-muted tabular-nums" aria-live="polite">
        картка {s.position} з {s.total}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-[330px] rounded-ui bg-green px-[18px] py-[22px]">
          <CardQuestion item={card} hint="питання" />
        </div>
        <div className="relative h-[330px] overflow-hidden rounded-ui bg-green">
          <div
            aria-hidden={!s.flipped}
            className={cn(
              'h-full overflow-y-auto px-[18px] py-[18px] transition-[filter] duration-200',
              !s.flipped && 'blur-md select-none',
            )}
          >
            <CardAnswer item={card} />
          </div>
          {!s.flipped && (
            <button
              type="button"
              onClick={s.flip}
              className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-on-green-strong"
            >
              показати відповідь · Space
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="no" onClick={() => s.answer(false)}>
          не знаю
        </Button>
        <Button onClick={() => s.answer(true)}>знаю</Button>
      </div>
      <p className="m-0 flex justify-center gap-5 text-[12.5px] text-muted">
        <span>
          <Kbd>Space</Kbd> перевернути
        </span>
        <span>
          <Kbd>←</Kbd> не знаю
        </span>
        <span>
          <Kbd>→</Kbd> знаю
        </span>
      </p>
    </div>
  );
}

export default function CardsView() {
  const screen = useCardsScreen();
  return (
    <DesktopPage
      topBar={
        <>
          <h1 className="sr-only">картки</h1>
          <ChipRow
            id="cards-filter"
            label="категорії карток"
            options={FILTER_OPTIONS}
            value={screen.filter}
            onChange={screen.setFilter}
          />
        </>
      }
      bodyClassName="grid min-h-0 grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="flex min-h-0 justify-center overflow-auto px-6 py-8">
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
      <aside className="min-h-0 overflow-auto border-l border-line-faint bg-bg-deep px-5 py-[18px]">
        <BoxDistributionPanel items={screen.items} progress={screen.progress} />
      </aside>
    </DesktopPage>
  );
}
