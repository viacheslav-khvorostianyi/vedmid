import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

export const OFFLINE_BANNER_DELAY_MS = 2000;

/** Thin top banner, shown only after 2 s offline to avoid flicker on flaky Wi-Fi. */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (online) return;
    const t = setTimeout(() => setShow(true), OFFLINE_BANNER_DELAY_MS);
    return () => {
      clearTimeout(t);
      setShow(false);
    };
  }, [online]);

  return (
    <div role="status" aria-live="polite">
      {show && !online && (
        <p className="m-0 border-b border-warn-bg bg-warn-bg/40 px-4 py-1.5 pt-[calc(0.375rem+env(safe-area-inset-top,0px))] text-center text-xs text-warn">
          офлайн — показуємо збережене меню
        </p>
      )}
    </div>
  );
}
