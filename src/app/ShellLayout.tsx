import { lazy, Suspense } from 'react';
import { ScrollRestoration } from 'react-router';
import { useIsDesktop } from '@/lib/useMediaQuery';
import { useOfflineSync } from '@/lib/useOfflineSync';

const MobileShell = lazy(() => import('@/shells/mobile/MobileShell'));
const DesktopShell = lazy(() => import('@/shells/desktop/DesktopShell'));

export default function ShellLayout() {
  const Shell = useIsDesktop() ? DesktopShell : MobileShell;
  // Shells render only for signed-in users (RequireAuth), so queued answers can be sent.
  useOfflineSync(true);
  return (
    <>
      {/* Restores window scroll on back navigation (e.g. detail → menu list on mobile). */}
      <ScrollRestoration />
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <Shell />
      </Suspense>
    </>
  );
}
