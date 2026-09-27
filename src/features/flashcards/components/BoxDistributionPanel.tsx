import type { MenuItem } from '@/features/menu/types';
import ProgressBar from '@/ui/ProgressBar';
import SectionTitle from '@/ui/SectionTitle';
import { BOX_INTERVAL_DAYS, boxDistribution, type CardProgress } from '../leitner';

const BOX_HINT = ['щодня', ...BOX_INTERVAL_DAYS.slice(1, 4).map((d) => `через ${d} дн.`), 'вивчено'];

/** Desktop drawer (proposal D2): how the current category's cards spread over the Leitner boxes. */
export default function BoxDistributionPanel({
  items,
  progress,
}: {
  items: readonly MenuItem[];
  progress: readonly CardProgress[];
}) {
  const { unseen, boxes } = boxDistribution(items, progress);
  const total = items.length;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="box-distribution">
      <SectionTitle as="h2" size="sm">
        <span id="box-distribution">прогрес колоди</span>
      </SectionTitle>
      <Row label="нові" count={unseen} total={total} />
      {boxes.map((count, i) => (
        <Row key={i} label={`коробка ${i + 1} · ${BOX_HINT[i]}`} count={count} total={total} />
      ))}
    </section>
  );
}

function Row({ label, count, total }: { label: string; count: number; total: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <ProgressBar value={count} max={Math.max(total, 1)} label={label} />
    </div>
  );
}
