import type { MenuItem } from '@/features/menu/types';

/** Front of a card (PDF p.3): subcategory and title. */
export default function CardQuestion({ item, hint }: { item: MenuItem; hint?: string }) {
  return (
    <span className="flex h-full flex-col items-center gap-4 text-center">
      <span className="font-mono text-lg font-extrabold text-on-green-soft">
        {item.subcategory.toLowerCase()}
      </span>
      <span className="mt-3 max-w-[30ch] font-mono text-[15px] leading-snug font-extrabold text-on-green-strong">
        {item.title}
      </span>
      {hint && <span className="mt-auto text-[12.5px] text-on-green-soft">{hint}</span>}
    </span>
  );
}
