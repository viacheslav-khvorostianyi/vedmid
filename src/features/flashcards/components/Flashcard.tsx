import { useRef, useState, type PointerEvent } from 'react';
import type { MenuItem } from '@/features/menu/types';
import { cn } from '@/lib/cn';
import CardAnswer from './CardAnswer';
import CardQuestion from './CardQuestion';

export const SWIPE_THRESHOLD = 90;

interface FlashcardProps {
  item: MenuItem;
  flipped: boolean;
  onFlip: () => void;
  /** right = знаю, left = не знаю */
  onSwipe: (known: boolean) => void;
}

/** Mobile flashcard: tap (or Enter/Space) flips it in 3D; a horizontal swipe past 90px answers. */
export default function Flashcard({ item, flipped, onFlip, onSwipe }: FlashcardProps) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const dragged = useRef(false);

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    startX.current = e.clientX;
    dragged.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (startX.current === null) return;
    const d = e.clientX - startX.current;
    if (Math.abs(d) > 8) dragged.current = true;
    setDx(d);
  }
  function onPointerUp() {
    if (startX.current === null) return;
    startX.current = null;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) onSwipe(dx > 0);
    setDx(0);
  }
  function onClick() {
    // A swipe ends with a click event; it must not also flip the card.
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    onFlip();
  }

  const hint = Math.min(Math.abs(dx) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative perspective-[900px]">
      <button
        type="button"
        aria-pressed={flipped}
        aria-describedby="flashcard-hint"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startX.current = null;
          setDx(0);
        }}
        className={cn(
          'relative block h-[300px] w-full touch-pan-y rounded-ui select-none',
          dx === 0 && 'transition-transform duration-200',
        )}
        style={{ transform: dx ? `translateX(${dx}px) rotate(${dx / 18}deg)` : undefined }}
      >
        <span
          className={cn(
            'absolute inset-0 block transition-transform duration-[450ms] transform-3d',
            flipped && 'rotate-y-180',
          )}
        >
          <span
            aria-hidden={flipped}
            className="absolute inset-0 block rounded-ui bg-green px-[18px] py-[22px] backface-hidden"
          >
            <CardQuestion item={item} hint="торкнись для детального ознайомлення" />
          </span>
          <span
            aria-hidden={!flipped}
            className="absolute inset-0 block overflow-y-auto rounded-ui bg-green px-[18px] py-[18px] backface-hidden rotate-y-180"
          >
            <CardAnswer item={item} />
          </span>
        </span>
        {dx !== 0 && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-4 rounded-full px-3 py-1 text-sm font-semibold',
              dx > 0 ? 'right-4 bg-green-hi text-text' : 'left-4 bg-warn-bg text-warn',
            )}
            style={{ opacity: hint }}
          >
            {dx > 0 ? 'знаю' : 'не знаю'}
          </span>
        )}
      </button>
    </div>
  );
}
