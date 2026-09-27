import { NavLink } from 'react-router';
import { NAV_ITEMS } from '@/app/navigation';
import { chipClass } from '@/ui/Chip';

export default function BottomNav() {
  return (
    <nav
      aria-label="основна навігація"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-bg px-3.5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="mx-auto grid max-w-[560px] grid-cols-4 gap-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => chipClass(isActive, 'px-0 text-[13px]')}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
