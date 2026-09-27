import { useEffect, useRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import Chip from './Chip';

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

interface TabChipsProps<T extends string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the tab list */
  label: string;
  idPrefix: string;
  panelId?: string;
  fill?: boolean;
  className?: string;
}

/** Tab list of chips with roving focus (←/→, Home/End). Internal to ChipRow and SegmentedTabs. */
export default function TabChips<T extends string>({
  options,
  value,
  onChange,
  label,
  idPrefix,
  panelId,
  fill = false,
  className,
}: TabChipsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const listRef = useRef<HTMLDivElement>(null);

  // Bring the selected chip into view by scrolling the row only. (scrollIntoView would also scroll the page,
  // which broke scroll restoration when returning to the menu.)
  useEffect(() => {
    const list = listRef.current;
    const chip = refs.current.get(value);
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < list.scrollLeft) list.scrollTo({ left: Math.max(left - 16, 0) });
    else if (right > list.scrollLeft + list.clientWidth)
      list.scrollTo({ left: right - list.clientWidth + 16 });
  }, [value]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const i = options.findIndex((o) => o.value === value);
    const last = options.length - 1;
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % options.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + options.length) % options.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current.get(options[next].value)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={cn('relative flex gap-2.5', fill ? '' : 'no-scrollbar snap-x overflow-x-auto', className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Chip
            key={o.value}
            ref={(el) => {
              if (el) refs.current.set(o.value, el);
              else refs.current.delete(o.value);
            }}
            role="tab"
            id={`${idPrefix}-tab-${o.value}`}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            selected={selected}
            onClick={() => onChange(o.value)}
            onKeyDown={onKeyDown}
            className={cn('snap-start', fill && 'flex-1 px-1.5 text-[13px]')}
          >
            {o.label}
          </Chip>
        );
      })}
    </div>
  );
}
