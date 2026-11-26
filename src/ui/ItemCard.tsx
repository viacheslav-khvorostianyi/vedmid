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
  /** Thumbnail URL; the card switches to a left-aligned row layout */
  photo?: string | null;
  compact?: boolean;
  className?: string;
}

/** Outlined menu item card: centred serif title, or a thumbnail row when `photo` is set. Renders a link when `to` is given. */
export default function ItemCard({
  title,
  to,
  onClick,
  selected = false,
  tag,
  badges,
  photo,
  compact = false,
  className,
}: ItemCardProps) {
  const classes = cn(
    'relative flex w-full items-center rounded-ui border border-line',
    photo ? 'gap-3.5 p-3 text-left' : 'justify-center p-[18px] text-center',
    'font-display text-[17px] leading-snug font-semibold text-text transition-colors hover:bg-green/20',
    photo ? 'min-h-24' : compact ? 'min-h-24' : 'min-h-28',
    compact && 'text-base',
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
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn('shrink-0 rounded-[8px] bg-green object-cover', compact ? 'size-16' : 'size-[72px]')}
        />
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
