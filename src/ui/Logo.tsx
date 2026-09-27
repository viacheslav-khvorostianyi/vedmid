import { cn } from '@/lib/cn';
import BearMark from './BearMark';

interface LogoProps {
  size?: 'md' | 'lg';
  /** Stacked (bear above text) for the login screen */
  stacked?: boolean;
  className?: string;
}

/** Brand lockup: bear + «база знань / ПРОСТО ЛІС». */
export default function Logo({ size = 'md', stacked = false, className }: LogoProps) {
  return (
    <div
      className={cn('flex items-center gap-2.5', stacked && 'flex-col gap-3 text-center', className)}
      role="img"
      aria-label="Просто ЛІС — база знань"
    >
      <BearMark className={cn('text-green', size === 'lg' ? 'h-16 w-[116px]' : 'h-7 w-[52px]')} />
      <div className="leading-tight" aria-hidden="true">
        <span className={cn('block text-text', size === 'lg' ? 'text-base' : 'text-[13px]')}>база знань</span>
        <span
          className={cn(
            'block font-mono font-extrabold tracking-wide text-lockup',
            size === 'lg' ? 'text-xl' : 'text-[17px]',
          )}
        >
          ПРОСТО ЛІС
        </span>
      </div>
    </div>
  );
}
