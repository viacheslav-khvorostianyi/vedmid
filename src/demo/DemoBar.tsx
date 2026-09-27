import { useState } from 'react';
import type { StaffRole } from '@/features/auth/context';
import { queryPersister } from '@/lib/queryClient';
import { chipClass } from '@/ui/Chip';
import { getRole, resetDemo, setRole } from './storage';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'waiter', label: 'офіціант' },
  { value: 'manager', label: 'менеджер' },
];

/** The app restores queries (profile, progress) from its persisted cache; drop it so the change shows. */
async function reloadFresh(path?: string) {
  await queryPersister.removeClient();
  if (path) window.location.assign(path);
  else window.location.reload();
}

/** Floating «демо» pill: explains the demo, switches role, resets the demo data. */
export default function DemoBar() {
  const [open, setOpen] = useState(false);
  const role = getRole();

  return (
    <div className="fixed right-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-end gap-2 desk:right-4 desk:bottom-4">
      {open && (
        <div
          id="demo-panel"
          className="flex w-72 flex-col gap-3 rounded-ui border border-warn-bg bg-bg-deep p-4 text-sm text-text shadow-lg"
        >
          <p className="m-0">
            Демо-режим: без сервера, на реальному меню. Прогрес зберігається лише в цьому браузері.
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">роль</span>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={role === r.value}
                  className={chipClass(role === r.value, 'min-h-9 px-3')}
                  onClick={async () => {
                    setRole(r.value);
                    await reloadFresh();
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 text-xs text-muted">
            Вхід після «вийти»: будь-яка пошта, потім будь-які 6 цифр як код.
          </p>
          <button
            type="button"
            className="self-start text-xs text-warn underline"
            onClick={async () => {
              resetDemo();
              await reloadFresh('/menu');
            }}
          >
            скинути демо-дані
          </button>
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="demo-panel"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-warn-bg bg-warn-bg px-3 py-1.5 text-xs font-semibold text-warn shadow-lg"
      >
        демо · {ROLES.find((r) => r.value === role)!.label}
      </button>
    </div>
  );
}
