import { NavLink } from 'react-router';
import { MANAGER_NAV_ITEM, NAV_ITEMS, type NavItem } from '@/app/navigation';
import { cn } from '@/lib/cn';
import Logo from '@/ui/Logo';

interface SidebarProps {
  showManager: boolean;
  user: { name: string; subtitle: string } | null;
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      aria-keyshortcuts={item.hint}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-2.5 rounded-ui px-3 text-[14.5px] transition-colors',
          isActive ? 'bg-green text-text' : 'text-muted hover:bg-bg-raised hover:text-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {item.label}
          <kbd
            className={cn('ml-auto font-mono text-[11px]', isActive ? 'text-on-green-soft' : 'text-muted/70')}
          >
            {item.hint}
          </kbd>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ showManager, user }: SidebarProps) {
  const initials = user?.name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex flex-col gap-2 border-r border-line-faint bg-bg-deep px-4 py-[22px]">
      <Logo className="mb-[22px]" />
      <nav aria-label="основна навігація" className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        {showManager && <SidebarLink item={MANAGER_NAV_ITEM} />}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-line-faint pt-3.5 text-[13px]">
        {user ? (
          <>
            <span className="grid size-[34px] place-items-center rounded-full bg-green font-mono text-[13px] font-extrabold">
              {initials}
            </span>
            <div>
              {user.name}
              <div className="text-xs text-muted">{user.subtitle}</div>
            </div>
          </>
        ) : (
          <span className="text-muted">завантаження профілю…</span>
        )}
      </div>
    </aside>
  );
}
