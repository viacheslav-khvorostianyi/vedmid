import type { MenuItem } from '@/features/menu/types';

/** Front of a card (PDF p.3): subcategory and title. */
export default function CardQuestion({ item, hint }: { item: MenuItem; hint?: string }) {
  return (
    <span className="flex h-full flex-col items-center gap-4 text-center">
      <span className="font-display text-xl font-semibold text-on-green-soft">
        {item.subcategory.toLowerCase()}
      </span>
      <span className="mt-3 max-w-[30ch] font-display text-[22px] leading-snug font-bold text-on-green-strong">
        {item.title}
      </span>
      {hint && <span className="mt-auto text-[12.5px] text-on-green-soft">{hint}</span>}
    </span>
  );
}
