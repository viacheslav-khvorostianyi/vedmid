import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export const TOAST_DURATION_MS = 3000;

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** One toast at a time, queued, 3 s each. Shells set --toast-offset so it clears the bottom nav. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<{ id: number; message: string }[]>([]);
  const current = queue[0];

  const show = useCallback<ShowToast>((message) => {
    setQueue((q) => [...q, { id: Date.now() + Math.random(), message }]);
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [current]);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
        style={{ bottom: 'var(--toast-offset, 1.5rem)' }}
      >
        {current && (
          <div
            key={current.id}
            className="rounded-ui border border-line-soft bg-bg-raised px-4 py-3 text-sm text-text shadow-lg"
          >
            {current.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
