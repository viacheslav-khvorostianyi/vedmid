import type { MenuItem } from '@/features/menu/types';

function Row({ label, children }: { label: string; children: string }) {
  return (
    <span className="block">
      <span className="block font-mono text-xs font-bold text-on-green-soft lowercase">{label}</span>
      <span className="block text-[13.5px] leading-snug text-on-green-strong">{children}</span>
    </span>
  );
}

/** Back of a card: what the waiter should be able to recall. Spans only, so it can live inside a button. */
export default function CardAnswer({ item }: { item: MenuItem }) {
  return (
    <span className="flex flex-col gap-2.5 text-left">
      {item.category === 'wine' && item.grapeVarieties && <Row label="сорт">{item.grapeVarieties}</Row>}
      {item.sweetness && <Row label="солодкість">{item.sweetness}</Row>}
      {item.ingredients && <Row label={item.category === 'wine' ? 'опис' : 'склад'}>{item.ingredients}</Row>}
      {item.allergens.length > 0 && <Row label="алергени">{item.allergens.join(', ')}</Row>}
      {item.anchor && <Row label="якір">{item.anchor}</Row>}
      {item.sales && <Row label="фраза для продажу">{item.sales}</Row>}
    </span>
  );
}
