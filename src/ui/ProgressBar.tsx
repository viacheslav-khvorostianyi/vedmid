import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max: number;
  /** Accessible name, e.g. «прогрес до рівня 4» */
  label: string;
  className?: string;
}

export default function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      className={cn('h-2 overflow-hidden rounded-full bg-bg-deep', className)}
    >
      <div
        className="h-full rounded-full bg-line transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
