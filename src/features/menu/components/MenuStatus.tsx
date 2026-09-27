import Button from '@/ui/Button';
import Skeleton from '@/ui/Skeleton';

export function MenuLoading({ cards = 4, compact = false }: { cards?: number; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3.5" aria-busy="true" aria-label="завантажуємо меню">
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: cards }, (_, i) => (
        <Skeleton key={i} className={compact ? 'h-24 w-full' : 'h-28 w-full'} />
      ))}
    </div>
  );
}

export function MenuError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="m-0 text-sm">Не вдалося завантажити меню. Перевір з’єднання й спробуй ще раз.</p>
      <Button size="sm" variant="ghost" onClick={onRetry}>
        спробувати ще раз
      </Button>
    </div>
  );
}
