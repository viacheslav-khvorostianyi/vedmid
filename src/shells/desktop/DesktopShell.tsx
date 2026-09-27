import { Suspense } from 'react';
import { Outlet, useMatches, useNavigate } from 'react-router';
import { MANAGER_NAV_ITEM, NAV_ITEMS, type ShellHandle } from '@/app/navigation';
import { useAuth } from '@/features/auth/context';
import { useHotkeys } from '@/lib/useHotkeys';
import OfflineBanner from '@/ui/OfflineBanner';
import Skeleton from '@/ui/Skeleton';
import Sidebar from './Sidebar';

const ROLE_LABEL = { waiter: 'офіціант', manager: 'менеджер' } as const;

export default function DesktopShell() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isManager = profile?.role === 'manager';
  const user = profile ? { name: profile.displayName, subtitle: ROLE_LABEL[profile.role] } : null;
  const items = isManager ? [...NAV_ITEMS, MANAGER_NAV_ITEM] : NAV_ITEMS;
  const noSectionHotkeys = useMatches().some((m) => (m.handle as ShellHandle | undefined)?.noSectionHotkeys);
  useHotkeys(
    Object.fromEntries(items.map((item) => [item.hotkey, () => void navigate(item.to)])),
    !noSectionHotkeys,
  );

  return (
    <div data-shell="desktop" className="grid h-dvh grid-cols-[232px_1fr]">
      <Sidebar showManager={isManager} user={user} />
      <main className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <OfflineBanner />
        <Suspense fallback={<Skeleton className="h-40 w-full" />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
