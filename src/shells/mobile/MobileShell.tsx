import type { CSSProperties } from 'react';
import { Suspense } from 'react';
import { Outlet, useMatches } from 'react-router';
import type { ShellHandle } from '@/app/navigation';
import { cn } from '@/lib/cn';
import Logo from '@/ui/Logo';
import Skeleton from '@/ui/Skeleton';
import OfflineBanner from '@/ui/OfflineBanner';
import BottomNav from './BottomNav';

// Clears the fixed bottom nav (≈ 4.75rem + safe area) for page content and toasts.
const NAV_CLEARANCE = 'calc(5.5rem + env(safe-area-inset-bottom, 0px))';

export default function MobileShell() {
  const matches = useMatches();
  const handles = matches.map((m) => m.handle as ShellHandle | undefined);
  const showLockup = handles.some((h) => h?.lockup);
  const hideNav = handles.some((h) => h?.hideNav);

  return (
    <div
      data-shell="mobile"
      className="mx-auto flex min-h-dvh max-w-[560px] flex-col"
      style={
        (hideNav ? {} : { '--toast-offset': NAV_CLEARANCE, paddingBottom: NAV_CLEARANCE }) as CSSProperties
      }
    >
      <OfflineBanner />
      {showLockup && (
        <header className="px-4 pt-[calc(1.375rem+env(safe-area-inset-top,0px))]">
          <Logo />
        </header>
      )}
      <main
        className={cn(
          'flex flex-1 flex-col px-4',
          showLockup ? 'pt-[22px]' : 'pt-[calc(1.375rem+env(safe-area-inset-top,0px))]',
        )}
      >
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <Outlet />
        </Suspense>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
