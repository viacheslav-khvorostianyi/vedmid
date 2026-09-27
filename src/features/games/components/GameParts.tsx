import { Heart, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';
import Button from '@/ui/Button';
import SectionTitle from '@/ui/SectionTitle';

/** ✕ back to the games list · game-specific status on the right. */
export function GameTopBar({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Link
        to="/games"
        aria-label="вийти з гри"
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-ui text-muted hover:text-text"
      >
        <X aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </Link>
      <h1 className="m-0 font-mono text-lg font-extrabold text-green-hi">{title}</h1>
      <div className="ml-auto flex items-center gap-3 text-sm text-muted tabular-nums">{children}</div>
    </div>
  );
}

export function Lives({ left, max }: { left: number; max: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`життя: ${left} з ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart
          key={i}
          aria-hidden="true"
          className={cn('size-4', i < left ? 'fill-warn text-warn' : 'text-muted/50')}
          strokeWidth={1.8}
        />
      ))}
    </span>
  );
}

export type OptionState = 'idle' | 'picked-correct' | 'picked-wrong' | 'reveal' | 'rest';

interface OptionButtonProps {
  state: OptionState;
  onClick: () => void;
  children: ReactNode;
  /** 1-based key hint shown on desktop */
  hotkey?: number;
}

/** Answer option. Feedback (DESIGN §5.4): right = green fill; wrong = warm fill and the right one outlined. */
export function OptionButton({ state, onClick, children, hotkey }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state !== 'idle'}
      aria-keyshortcuts={hotkey ? String(hotkey) : undefined}
      className={cn(
        'flex min-h-12 w-full items-start gap-3 rounded-ui border px-4 py-3 text-left text-[14.5px] leading-snug transition-colors',
        state === 'idle' && 'border-line text-text hover:bg-green/20',
        state === 'picked-correct' && 'border-green bg-green text-text',
        state === 'picked-wrong' && 'border-warn-bg bg-warn-bg text-warn',
        state === 'reveal' && 'border-2 border-line text-text',
        state === 'rest' && 'border-line-soft text-muted',
      )}
    >
      {hotkey && (
        <kbd className="mt-0.5 font-mono text-xs text-muted" aria-hidden="true">
          {hotkey}
        </kbd>
      )}
      <span className="flex-1">{children}</span>
      {state === 'picked-correct' && <span className="sr-only">— правильно</span>}
      {state === 'picked-wrong' && <span className="sr-only">— неправильно</span>}
      {state === 'reveal' && <span className="sr-only">— правильна відповідь</span>}
    </button>
  );
}

export function optionState(index: number, picked: number | null, correct: number): OptionState {
  if (picked === null) return 'idle';
  if (index === correct) return picked === correct ? 'picked-correct' : 'reveal';
  return index === picked ? 'picked-wrong' : 'rest';
}

/** «далі» after an answer; takes focus so keyboard and screen-reader users continue naturally. */
export function NextButton({ onClick, last }: { onClick: () => void; last: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <Button ref={ref} onClick={onClick} fullWidth>
      {last ? 'результати' : 'далі'}
    </Button>
  );
}

export function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface ResultsProps {
  title: string;
  score: number;
  total: number;
  xpEarned: number | null;
  detail?: string;
  onRestart: () => void;
}

export function GameResults({ title, score, total, xpEarned, detail, onRestart }: ResultsProps) {
  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <SectionTitle as="h2">{title}: результат</SectionTitle>
      <p className="m-0 font-mono text-3xl font-extrabold tabular-nums">
        {score} з {total}
      </p>
      {detail && <p className="m-0 text-sm text-muted">{detail}</p>}
      <p className="m-0 text-sm">
        {xpEarned === null ? 'XP нарахуємо, щойно з’явиться зв’язок.' : `+${xpEarned} XP за цю гру`}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Button onClick={onRestart}>ще раз</Button>
        <Link
          to="/games"
          className="inline-flex min-h-12 items-center justify-center rounded-ui border border-line text-[15px] text-muted hover:text-text"
        >
          до ігор
        </Link>
      </div>
    </section>
  );
}

export function GameCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-2 rounded-ui border border-line p-4 transition-colors hover:bg-green/20"
    >
      <span className="font-mono text-[15px] font-bold">{title}</span>
      <span className="text-[13px] text-muted">{description}</span>
    </Link>
  );
}
