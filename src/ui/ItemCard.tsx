import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/cn';

interface ItemCardProps {
  title: string;
  to?: string;
  onClick?: () => void;
  selected?: boolean;
  /** Category label shown in flat search results */
  tag?: string;
  badges?: ReactNode;
  compact?: boolean;
  className?: string;
}

/** Outlined menu item card with a centred mono title. Renders a link when `to` is given. */
export default function ItemCard({
  title,
  to,
  onClick,
  selected = false,
  tag,
  badges,
  compact = false,
  className,
}: ItemCardProps) {
  const classes = cn(
    'relative flex w-full items-center justify-center rounded-ui border border-line p-[18px] text-center',
    'font-mono text-sm leading-snug font-bold text-text transition-colors hover:bg-green/20',
    compact ? 'min-h-24 text-[13px]' : 'min-h-28',
    // room for the badge row so it never covers the title
    !!(tag || badges) && 'pt-9',
    selected && 'bg-green/35',
    className,
  );
  const body = (
    <>
      {(tag || badges) && (
        <span className="absolute top-2 right-2 flex gap-1.5 font-sans text-xs font-normal">
          {tag && <span className="rounded-full border border-line-soft px-2 py-0.5 text-muted">{tag}</span>}
          {badges}
        </span>
      )}
      <span className="max-w-[28ch]">{title}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes} aria-current={selected ? 'true' : undefined}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} aria-pressed={selected}>
      {body}
    </button>
  );
}
