import Button from '@/ui/Button';
import SectionTitle from '@/ui/SectionTitle';

interface SummaryProps {
  known: number;
  unknown: number;
  onRestart: (mode: 'all' | 'mistakes') => void;
}

export function SessionSummary({ known, unknown, onRestart }: SummaryProps) {
  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <SectionTitle as="h2">колоду пройдено</SectionTitle>
      <p className="m-0 font-mono text-lg tabular-nums">
        знаю {known} · повторити {unknown}
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="ghost" onClick={() => onRestart('all')}>
          ще раз
        </Button>
        <Button variant="no" disabled={unknown === 0} onClick={() => onRestart('mistakes')}>
          лише помилки
        </Button>
      </div>
    </section>
  );
}

export function AllCaughtUp({ onPracticeAll }: { onPracticeAll: () => void }) {
  return (
    <section className="flex flex-col items-start gap-4">
      <SectionTitle as="h2">на сьогодні все</SectionTitle>
      <p className="m-0 text-sm">
        Усі картки цієї категорії повторено. Наступні з’являться, коли настане час їх повторити.
      </p>
      <Button variant="ghost" onClick={onPracticeAll}>
        повторити все одно
      </Button>
    </section>
  );
}
