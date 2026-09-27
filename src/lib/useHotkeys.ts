import { useEffect, useRef } from 'react';

/**
 * Binds single-key shortcuts by KeyboardEvent.code ("Digit1", "KeyM", "Slash"), so they work on the
 * Ukrainian layout too. Ignored while typing in a field or when a modifier key is held.
 * A handler may return `false` to pass the key through (keeping the browser default).
 */
export function useHotkeys(bindings: Record<string, (e: KeyboardEvent) => boolean | void>, enabled = true) {
  const ref = useRef(bindings);
  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target)) return;
      const handler = ref.current[e.code];
      if (!handler) return;
      if (handler(e) !== false) e.preventDefault();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
