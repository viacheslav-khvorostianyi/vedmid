import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface DesktopPageProps {
  /** Top bar content: search, chips, counters, page actions */
  topBar?: ReactNode;
  children: ReactNode;
  /** Body layout, e.g. "grid grid-cols-[210px_1fr_400px]". Defaults to a padded scrolling column. */
  bodyClassName?: string;
}

/** Page frame for desktop views: optional top bar + a body that fills the remaining height. */
export default function DesktopPage({ topBar, children, bodyClassName }: DesktopPageProps) {
  return (
    <>
      {topBar && (
        <div className="flex min-h-[76px] items-center gap-4 border-b border-line-faint px-[26px] py-4">
          {topBar}
        </div>
      )}
      <div className={cn('min-h-0 flex-1', bodyClassName ?? 'overflow-auto px-[26px] py-[22px]')}>
        {children}
      </div>
    </>
  );
}
