import { useEffect, useRef } from 'react';

/** Calls `onTick` every second while `active`. */
export function useTicker(active: boolean, onTick: () => void) {
  const ref = useRef(onTick);
  useEffect(() => {
    ref.current = onTick;
  });
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => ref.current(), 1000);
    return () => clearInterval(id);
  }, [active]);
}
